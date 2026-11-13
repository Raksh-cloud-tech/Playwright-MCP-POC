import { chromium } from "playwright";
export async function inspectPage(url) {
    const browser = await chromium.launch({
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle",
    });
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    const html = await page.content();
    await page.screenshot({
        path: "inspect.png",
        fullPage: true,
    });
    const pageInfo = await page.evaluate(() => {
        function buildLocator(el) {
            if (el.id)
                return `#${el.id}`;
            if (el.getAttribute("data-testid"))
                return `[data-testid="${el.getAttribute("data-testid")}"]`;
            if (el.name)
                return `[name="${el.name}"]`;
            if (el.placeholder)
                return `[placeholder="${el.placeholder}"]`;
            if (el.getAttribute("aria-label"))
                return `[aria-label="${el.getAttribute("aria-label")}"]`;
            return "";
        }
        function mapElement(el) {
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
    await browser.close();
    return {
        title,
        url,
        frames,
        html,
        screenshot: "inspect.png",
        ...pageInfo,
    };
}
