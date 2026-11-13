import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";

const MAX_HTML_CHARS = 200_000;
const NAVIGATION_TIMEOUT_MS = 30_000;

export async function inspectPage(url: string) {
    // Only web pages: file://, chrome:// and similar schemes could expose local files.
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Only http and https URLs can be inspected.");
    }

    const browser = await chromium.launch({
        headless: true,
    });

    try {
        const page = await browser.newPage();
        await page.goto(parsedUrl.toString(), {
            waitUntil: "networkidle",
            timeout: NAVIGATION_TIMEOUT_MS,
        });

        const title = await page.title();
        const fullHtml = await page.content();
        const htmlTruncated = fullHtml.length > MAX_HTML_CHARS;
        const html = htmlTruncated
            ? `${fullHtml.slice(0, MAX_HTML_CHARS)}\n<!-- truncated -->`
            : fullHtml;

        // Written to the OS temp folder so the working directory is never polluted.
        const screenshotPath = path.join(os.tmpdir(), "playwright-mcp-inspect.png");
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
        });

        const pageInfo = await page.evaluate(() => {
            function buildLocator(el: any) {
                if (el.id) return `#${el.id}`;

                if (el.getAttribute("data-testid"))
                    return `[data-testid="${el.getAttribute("data-testid")}"]`;

                if (el.name) return `[name="${el.name}"]`;

                if (el.placeholder)
                    return `[placeholder="${el.placeholder}"]`;

                if (el.getAttribute("aria-label"))
                    return `[aria-label="${el.getAttribute("aria-label")}"]`;

                return "";
            }

            function mapElement(el: any) {
                return {
                    tag: el.tagName,
                    id: el.id || "",
                    name: el.name || "",
                    class: el.className || "",
                    type: el.type || "",
                    text: (el.innerText || "").trim(),
                    placeholder: el.placeholder || "",
                    ariaLabel: el.getAttribute("aria-label") || "",
                    role: el.getAttribute("role") || "",
                    href: el.href || "",
                    value: el.value || "",
                    locator: buildLocator(el),
                };
            }

            return {
                inputs: [...document.querySelectorAll("input")].map(mapElement),

                buttons: [...document.querySelectorAll("button,input[type='button'],input[type='submit']")].map(mapElement),

                links: [...document.querySelectorAll("a")].map(mapElement),

                dropdowns: [...document.querySelectorAll("select")].map(mapElement),

                checkboxes: [...document.querySelectorAll("input[type='checkbox']")].map(mapElement),

                radioButtons: [...document.querySelectorAll("input[type='radio']")].map(mapElement),

                textareas: [...document.querySelectorAll("textarea")].map(mapElement),

                tables: [...document.querySelectorAll("table")].map(table => ({
                    id: table.id,
                    class: table.className,
                    rows: table.rows.length,
                })),

                forms: [...document.forms].map(form => ({
                    id: form.id,
                    name: form.name,
                    action: form.action,
                    method: form.method,
                })),

                dialogs: [...document.querySelectorAll("[role='dialog'],dialog")].map(mapElement),

                headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(mapElement),

                images: [...document.querySelectorAll("img")].map(img => ({
                    src: img.src,
                    alt: img.alt,
                })),

                navigation: [...document.querySelectorAll("nav")].map(mapElement),
            };
        });

        const frames = page.frames().map(frame => ({
            name: frame.name(),
            url: frame.url(),
        }));

        return {
            title,
            url: parsedUrl.toString(),
            frames,
            html,
            htmlTruncated,
            screenshot: screenshotPath,
            ...pageInfo,
        };
    } finally {
        // Always release the browser, even when navigation or evaluation fails.
        await browser.close();
    }
}
