import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { inspectPage } from "./helper/inspectpage.js";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const serverDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * The framework this server works on: the FRAMEWORK_PATH environment variable if set,
 * otherwise the sibling "playground" folder. No machine-specific paths are hardcoded.
 */
const FRAMEWORK_ROOT = path.resolve(
    process.env.FRAMEWORK_PATH ?? path.join(serverDir, "..", "playground")
);

/** A test run is stopped after this long (default 3 minutes). Override with TEST_TIMEOUT_MS. */
const TEST_TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS) || 180_000;
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

type ToolResult = { content: { type: "text"; text: string }[] };

const textResult = (text: string): ToolResult => ({
    content: [{ type: "text", text }],
});

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

// ---------------------------------------------------------------------------
// Path safety: every file tool is confined to the framework folder.
// ---------------------------------------------------------------------------

const BLOCKED_FOLDERS = new Set(["node_modules", ".git"]);

/** Resolves a path inside the framework folder, or throws if it escapes it or is off limits. */
function resolveInsideFramework(relativePath: string): { fullPath: string; rel: string } {
    const fullPath = path.resolve(FRAMEWORK_ROOT, relativePath);
    const rel = path.relative(FRAMEWORK_ROOT, fullPath);

    if (!rel || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
        throw new Error(`Path is outside the framework folder: ${relativePath}`);
    }

    const segments = rel.split(path.sep).map((segment) => segment.toLowerCase());
    const blocked = segments.find((segment) => BLOCKED_FOLDERS.has(segment));
    if (blocked) {
        throw new Error(`Access to ${blocked} is not allowed: ${relativePath}`);
    }

    const baseName = segments[segments.length - 1];
    if (baseName.startsWith(".env") && baseName !== ".env.example") {
        throw new Error(`Access to .env files is not allowed (they hold secrets): ${relativePath}`);
    }

    return { fullPath, rel };
}

// ---------------------------------------------------------------------------
// Test runner: runs Playwright with an argument array (never through a shell),
// so tool inputs can never be interpreted as shell commands.
// ---------------------------------------------------------------------------

function resolvePlaywrightCli(): string {
    try {
        return require.resolve("@playwright/test/cli", { paths: [FRAMEWORK_ROOT] });
    } catch {
        const packageJson = require.resolve("@playwright/test/package.json", {
            paths: [FRAMEWORK_ROOT],
        });
        return path.join(path.dirname(packageJson), "cli.js");
    }
}

/** Accepts only a *.spec.ts file inside the framework folder; returns it as a relative path. */
function resolveTestFile(testFile: string): string {
    const { rel } = resolveInsideFramework(testFile);
    if (!rel.toLowerCase().endsWith(".spec.ts")) {
        throw new Error("testFile must be a .spec.ts file inside the framework folder, e.g. tests/login.spec.ts");
    }
    return rel.split(path.sep).join("/");
}

async function runPlaywright(args: string[], headed: boolean): Promise<ToolResult> {
    let cli: string;
    try {
        cli = resolvePlaywrightCli();
    } catch {
        return textResult(
            `Could not find @playwright/test in ${FRAMEWORK_ROOT}. Run "npm install" in that folder first.`
        );
    }

    const cliArgs = [cli, "test", ...args];
    if (headed) cliArgs.push("--headed");

    try {
        const { stdout, stderr } = await execFileAsync(process.execPath, cliArgs, {
            cwd: FRAMEWORK_ROOT,
            timeout: TEST_TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
            windowsHide: true,
            // Never let the HTML reporter start a server and wait for a Ctrl+C that cannot come.
            env: { ...process.env, PW_TEST_HTML_REPORT_OPEN: "never" },
        });
        return textResult(stdout || stderr);
    } catch (error) {
        // A failing test run exits non-zero; its report is still in stdout.
        const failure = error as { stdout?: string; stderr?: string; killed?: boolean; message: string };
        const output = failure.stdout || failure.stderr || failure.message;
        if (failure.killed) {
            return textResult(
                `Stopped: the run exceeded ${TEST_TIMEOUT_MS / 1000}s (set TEST_TIMEOUT_MS to allow longer).\n\n${output}`
            );
        }
        return textResult(output);
    }
}

// ---------------------------------------------------------------------------
// Server and tools
// ---------------------------------------------------------------------------

const server = new McpServer({
    name: "playwright-framework-mcp",
    version: "1.1.0",
});

server.registerTool(
    "hello",
    {
        title: "Hello Tool",
        description: "Returns a greeting",
        inputSchema: {
            name: z.string(),
        },
    },
    async ({ name }) => textResult(`Hello ${name}! 👋`)
);

server.registerTool(
    "list_tests",
    {
        title: "List Playwright Tests",
        description: "Lists every test Playwright can find in the framework, without running them.",
        inputSchema: {},
    },
    async () => runPlaywright(["--list"], false)
);

server.registerTool(
    "run_playwright_test",
    {
        title: "Run Playwright Test",
        description:
            "Runs one Playwright spec file from the framework (for example tests/login.spec.ts). " +
            "Optionally filter by tag or title with grep (for example @smoke). Headless unless headed is true.",
        inputSchema: {
            testFile: z.string(),
            grep: z.string().optional(),
            headed: z.boolean().optional(),
        },
    },
    async ({ testFile, grep, headed }) => {
        try {
            const args = [resolveTestFile(testFile)];
            if (grep) args.push(`--grep=${grep}`);
            return await runPlaywright(args, headed ?? false);
        } catch (error) {
            return textResult(`Error: ${errorMessage(error)}`);
        }
    }
);

server.registerTool(
    "run_all_tests",
    {
        title: "Run All Playwright Tests",
        description:
            "Runs all Playwright tests in the framework. Optionally filter by tag or title with grep " +
            "(for example @smoke). Headless unless headed is true.",
        inputSchema: {
            grep: z.string().optional(),
            headed: z.boolean().optional(),
        },
    },
    async ({ grep, headed }) => {
        const args: string[] = [];
        if (grep) args.push(`--grep=${grep}`);
        return runPlaywright(args, headed ?? false);
    }
);

// create test, pom, util, fixture, api
const FOLDERS = {
    test: "tests",
    page: "POM",
    util: "Util",
    api: "APIPayloads",
    fixture: "Fixtures",
} as const;

/** Letters, digits, "_" and "-", optionally in sub-folders separated by "/". */
const SAFE_FILE_NAME = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

server.registerTool(
    "create_framework_file",
    {
        title: "Create Framework File",
        description: `
Creates a TypeScript Playwright framework file. Never overwrites: use update_framework_file to change an existing file.

Supported types:
- test
- page
- util
- fixture
- api

Rules:
- Always generate TypeScript.
- Always use ES module syntax (import/export).
- Never use require().
- Never use module.exports.
- Use Playwright Test (@playwright/test).
- Generate production-ready code.
- Follow Playwright best practices.
- Do not generate JavaScript.

Page Objects:
- Use Page and Locator from @playwright/test.
- Use private / public locators.
- Create reusable methods.
- Do not include test code.
- Export the class.

Tests:
- Import from @playwright/test.
- Import existing Page Objects from the POM folder.
- Do not duplicate locators.
- Use test.describe().
- Use test.beforeEach() where appropriate.
- Use expect() assertions.
- Follow the Page Object Model.

Utilities:
- Generate reusable TypeScript helper functions or classes.
- Export all public members.

API:
- Generate reusable TypeScript classes.
- Use Playwright APIRequestContext where appropriate.
- Export the class.

Fixtures:
- Use Playwright fixtures.
- Export the fixture properly.

The file must be created in the folder corresponding to the selected type.
`,
        inputSchema: {
            type: z.enum(["test", "page", "util", "fixture", "api"]),
            fileName: z.string(),
            content: z.string(),
        },
    },
    async ({ type, fileName, content }) => {
        try {
            // Remove extensions if the caller sends them
            const cleanFileName = fileName
                .replace(/\\/g, "/")
                .replace(/\.spec\.ts$/i, "")
                .replace(/\.test\.ts$/i, "")
                .replace(/\.ts$/i, "")
                .replace(/\.js$/i, "")
                .trim();

            if (!SAFE_FILE_NAME.test(cleanFileName)) {
                throw new Error(
                    "fileName may only contain letters, digits, '_' and '-' (optionally in sub-folders separated by '/')."
                );
            }

            const extension = type === "test" ? ".spec.ts" : ".ts";
            const { fullPath, rel } = resolveInsideFramework(
                path.join(FOLDERS[type], `${cleanFileName}${extension}`)
            );

            await fs.mkdir(path.dirname(fullPath), { recursive: true });

            try {
                // "wx": fail instead of silently overwriting an existing file
                await fs.writeFile(fullPath, content, { encoding: "utf8", flag: "wx" });
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "EEXIST") {
                    throw new Error(`${rel} already exists. Use update_framework_file to change it.`);
                }
                throw error;
            }

            return textResult(`Successfully created ${rel}\n\nLocation:\n${fullPath}`);
        } catch (error) {
            return textResult(`Error: ${errorMessage(error)}`);
        }
    }
);

server.registerTool(
    "inspect_page",
    {
        title: "Inspect Playwright Page",
        description:
            "Opens an http(s) page and returns its forms, elements and locator suggestions for building page objects.",
        inputSchema: {
            url: z.string(),
        },
    },
    async ({ url }) => {
        try {
            const result = await inspectPage(url);
            return textResult(JSON.stringify(result, null, 2));
        } catch (error) {
            return textResult(errorMessage(error));
        }
    }
);

server.registerTool(
    "read_framework_file",
    {
        title: "Read Framework File",
        description: "Reads a file inside the Playwright framework folder. .env files, node_modules and .git are off limits.",
        inputSchema: {
            relativePath: z.string(),
        },
    },
    async ({ relativePath }) => {
        try {
            const { fullPath } = resolveInsideFramework(relativePath);
            return textResult(await fs.readFile(fullPath, "utf8"));
        } catch (error) {
            return textResult(errorMessage(error));
        }
    }
);

server.registerTool(
    "update_framework_file",
    {
        title: "Update Framework File",
        description:
            "Writes a file inside the Playwright framework folder: overwrites it if it exists, otherwise creates it (and any missing folders).",
        inputSchema: {
            relativePath: z.string(),
            content: z.string(),
        },
    },
    async ({ relativePath, content }) => {
        try {
            const { fullPath } = resolveInsideFramework(relativePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, "utf8");
            return textResult(`Updated ${relativePath}`);
        } catch (error) {
            return textResult(errorMessage(error));
        }
    }
);

// Root-level files that can never be deleted through this tool
const PROTECTED_NAMES = new Set([
    "package.json",
    "package-lock.json",
    "playwright.config.ts",
    "tsconfig.json",
    "eslint.config.mjs",
    ".prettierrc",
    ".gitignore",
    ".env.example",
    "readme.md",
]);

server.registerTool(
    "delete_framework_file",
    {
        title: "Delete Framework Files",
        description:
            "Deletes one or more files inside the Playwright framework folder. Files only (no folders). Cannot delete config files, node_modules, .git or .env files.",
        inputSchema: {
            relativePaths: z.array(z.string()).min(1),
        },
    },
    async ({ relativePaths }) => {
        const results: string[] = [];

        for (const relativePath of relativePaths) {
            try {
                const { fullPath, rel } = resolveInsideFramework(relativePath);

                if (!rel.includes(path.sep) && PROTECTED_NAMES.has(rel.toLowerCase())) {
                    results.push(`SKIPPED ${relativePath}: protected`);
                    continue;
                }

                const stats = await fs.stat(fullPath);
                if (!stats.isFile()) {
                    results.push(`SKIPPED ${relativePath}: not a file`);
                    continue;
                }

                await fs.unlink(fullPath);
                results.push(`DELETED ${rel}`);
            } catch (error) {
                results.push(`SKIPPED ${relativePath}: ${errorMessage(error)}`);
            }
        }

        return textResult(results.join("\n"));
    }
);

// Start the server - keep this LAST so every tool is registered before connecting.
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Playwright MCP Server running (framework: ${FRAMEWORK_ROOT})`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
