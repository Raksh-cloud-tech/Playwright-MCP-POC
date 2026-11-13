import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { inspectPage } from "./helper/inspectpage.js";
const execAsync = promisify(exec);
const server = new McpServer({
    name: "playwright-framework-mcp",
    version: "1.0.0",
});
// Hello Tool
server.registerTool("hello", {
    title: "Hello Tool",
    description: "Returns a greeting",
    inputSchema: {
        name: z.string(),
    },
}, async ({ name }) => ({
    content: [
        {
            type: "text",
            text: `Hello ${name}! 👋`,
        },
    ],
}));
// Run Single Playwright Test
server.registerTool("run_playwright_test", {
    title: "Run Playwright Test",
    description: "Runs a Playwright test file from the framework.",
    inputSchema: {
        testFile: z.string(),
    },
}, async ({ testFile }) => {
    try {
        const frameworkPath = "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
        const { stdout, stderr } = await execAsync(`npx playwright test ${testFile} --headed`, {
            cwd: frameworkPath,
        });
        return {
            content: [
                {
                    type: "text",
                    text: stdout || stderr,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error.stdout || error.stderr || error.message,
                },
            ],
        };
    }
});
// Run All Tests
server.registerTool("run_all_tests", {
    title: "Run All Playwright Tests",
    description: "Runs all Playwright tests in the framework.",
    inputSchema: {},
}, async () => {
    try {
        const frameworkPath = "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
        const { stdout, stderr } = await execAsync("npx playwright test --headed", {
            cwd: frameworkPath,
        });
        return {
            content: [
                {
                    type: "text",
                    text: stdout || stderr,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error.stdout || error.stderr || error.message,
                },
            ],
        };
    }
});
//create test , pom , util , fixture, api
// server.registerTool(
//   "create_test",
//   {
//     title: "Create Playwright Test",
//     description: "Creates a new Playwright test file.",
//     inputSchema: {
//       fileName: z.string(),
//       content: z.string(),
//     },
//   },
//   async ({ fileName, content }) => {
//     const frameworkPath =
//       "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
//     const testPath = path.join(
//       frameworkPath,
//       "tests",
//       `${fileName}.spec.ts`
//     );
//     await fs.writeFile(testPath, content, "utf-8");
//     return {
//       content: [
//         {
//           type: "text",
//           text: `Created ${fileName}.spec.ts successfully.`,
//         },
//       ],
//     };
//   }
// );
const FOLDERS = {
    test: "tests",
    page: "POM",
    util: "Util",
    api: "APIPayloads",
    fixture: "Fixtures",
};
server.registerTool("create_framework_file", {
    title: "Create Framework File",
    description: `
Creates a TypeScript Playwright framework file.

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
}, async ({ type, fileName, content }) => {
    try {
        const FRAMEWORK_PATH = "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
        // Remove extensions if Claude sends them
        const cleanFileName = fileName
            .replace(/\.spec\.ts$/gi, "")
            .replace(/\.test\.ts$/gi, "")
            .replace(/\.ts$/gi, "")
            .replace(/\.js$/gi, "")
            .trim();
        // Determine folder
        const folder = FOLDERS[type];
        // Determine extension
        const extension = type === "test" ? ".spec.ts" : ".ts";
        // Full path
        const filePath = path.join(FRAMEWORK_PATH, folder, `${cleanFileName}${extension}`);
        // Create folder if it doesn't exist
        await fs.mkdir(path.dirname(filePath), {
            recursive: true,
        });
        // Create file
        await fs.writeFile(filePath, content, "utf8");
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully created ${cleanFileName}${extension}\n\n` +
                        `Location:\n${filePath}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
        };
    }
});
// inspect page
// server.registerTool(
//   "inspect_page",
//   {
//     title: "Inspect Playwright Page",
//     description:
//       "Inspect a webpage and return useful element information for generating Playwright Page Objects.",
//     inputSchema: {
//       url: z.string(),
//     },
//   },
//   async ({ url }) => {
//     try {
//       const browser = await chromium.launch({
//         headless: false,
//       });
//       const page = await browser.newPage();
//       await page.goto(url, {
//         waitUntil: "networkidle",
//       });
//       const pageInfo = await page.evaluate(() => {
//         const elements = Array.from(
//           document.querySelectorAll(
//             "input,button,select,textarea,a"
//           )
//         ).map((el: any) => ({
//           tag: el.tagName,
//           type: el.type || "",
//           id: el.id || "",
//           name: el.name || "",
//           placeholder: el.placeholder || "",
//           text: el.innerText || el.value || "",
//         }));
//         return {
//           title: document.title,
//           url: location.href,
//           elements,
//         };
//       });
//       await browser.close();
//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(pageInfo, null, 2),
//           },
//         ],
//       };
//     } catch (error: any) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: error.message,
//           },
//         ],
//       };
//     }
//   }
// );
server.registerTool("inspect_page", {
    title: "Inspect Playwright Page",
    description: "Inspects a webpage and returns DOM, accessibility tree, forms, elements, and locator suggestions.",
    inputSchema: {
        url: z.string()
    }
}, async ({ url }) => {
    try {
        const result = await inspectPage(url);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    catch (e) {
        return {
            content: [
                {
                    type: "text",
                    text: e.message
                }
            ]
        };
    }
});
// read framework
server.registerTool("read_framework_file", {
    title: "Read Framework File",
    description: "Reads any file from the Playwright framework.",
    inputSchema: {
        relativePath: z.string(),
    },
}, async ({ relativePath }) => {
    try {
        const FRAMEWORK_PATH = "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
        const filePath = path.join(FRAMEWORK_PATH, relativePath);
        const content = await fs.readFile(filePath, "utf8");
        return {
            content: [
                {
                    type: "text",
                    text: content,
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [
                {
                    type: "text",
                    text: err.message,
                },
            ],
        };
    }
});
// update framework
server.registerTool("update_framework_file", {
    title: "Update Framework File",
    description: "Updates an existing file inside the Playwright framework.",
    inputSchema: {
        relativePath: z.string(),
        content: z.string(),
    },
}, async ({ relativePath, content }) => {
    try {
        const FRAMEWORK_PATH = "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
        const filePath = path.join(FRAMEWORK_PATH, relativePath);
        await fs.writeFile(filePath, content, "utf8");
        return {
            content: [
                {
                    type: "text",
                    text: `Updated ${relativePath}`,
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [
                {
                    type: "text",
                    text: err.message,
                },
            ],
        };
    }
});
// delete framework files
const DELETE_ROOT = "C:\\Users\\rakshithp\\Desktop\\Playwright-MCP-CoE\\playground";
// Files and folders that can never be deleted through this tool
const PROTECTED_NAMES = new Set([
    "package.json",
    "package-lock.json",
    "playwright.config.ts",
    "tsconfig.json",
    ".gitignore",
]);
const PROTECTED_FOLDERS = new Set(["node_modules", ".git"]);
server.registerTool("delete_framework_file", {
    title: "Delete Framework Files",
    description: "Deletes one or more files inside the Playwright framework folder. Files only (no folders). Cannot delete config files, node_modules or .git.",
    inputSchema: {
        relativePaths: z.array(z.string()).min(1),
    },
}, async ({ relativePaths }) => {
    const root = path.resolve(DELETE_ROOT);
    const results = [];
    for (const relativePath of relativePaths) {
        try {
            const fullPath = path.resolve(root, relativePath);
            const rel = path.relative(root, fullPath);
            // Must stay inside the framework folder
            if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
                results.push(`SKIPPED ${relativePath}: outside the framework folder`);
                continue;
            }
            const segments = rel.split(path.sep);
            if (PROTECTED_FOLDERS.has(segments[0].toLowerCase()) ||
                (segments.length === 1 && PROTECTED_NAMES.has(segments[0].toLowerCase()))) {
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
        }
        catch (err) {
            results.push(`ERROR ${relativePath}: ${err.message}`);
        }
    }
    return {
        content: [{ type: "text", text: results.join("\n") }],
    };
});
// Start the server - keep this LAST so every tool is registered before connecting.
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Playwright MCP Server Running...");
}
main().catch(console.error);
