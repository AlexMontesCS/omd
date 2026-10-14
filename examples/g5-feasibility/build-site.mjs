// Assembles a self-contained static site for hosting (Vercel, Netlify, any CDN).
//
// The example pages import '../../dist/omd.browser.js', which only resolves
// inside this repo. This script copies the pages + bundle into `public/` and
// rewrites that import to a local path, so the folder can be deployed as-is.
import { mkdir, copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outDir = path.join(here, "public");
const bundle = path.join(repoRoot, "dist", "omd.browser.js");

// Source page -> deployed filename. demo becomes the site landing page.
// gallery.html is a local-only dev harness and is intentionally not published.
const pages = [
    { from: "demo.html", to: "index.html" },
    { from: "cookbook.html", to: "cookbook.html" },
    { from: "interactive.html", to: "interactive.html" },
    { from: "direct.html", to: "direct.html" },
    { from: "fractions.html", to: "fractions.html" },
];

// Clear only what this script generates — `.vercel/` (project link) and
// `.env.local` must survive so repeat deploys keep the same project + URL.
for ( const name of ["index.html", "cookbook.html", "interactive.html", "direct.html", "fractions.html", "omd.browser.js", "vercel.json"] )
    await rm(path.join(outDir, name), { force: true });

await copyFile(bundle, path.join(outDir, "omd.browser.js"));

for (const page of pages) {
    let html = await readFile(path.join(here, page.from), "utf8");

    // Point the module import at the co-located bundle.
    html = html.replaceAll("../../dist/omd.browser.js", "./omd.browser.js");

    // Rewrite cross-page links to their deployed names.
    html = html
        .replaceAll('href="./demo.html"', 'href="./index.html"')
        .replaceAll('href="./cookbook.html"', 'href="./cookbook.html"');

    await writeFile(path.join(outDir, page.to), html, "utf8");
}

// Static-only: no build step, long-cache the immutable bundle.
await writeFile(
    path.join(outDir, "vercel.json"),
    JSON.stringify(
        {
            $schema: "https://openapi.vercel.sh/vercel.json",
            headers: [
                {
                    source: "/omd.browser.js",
                    headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
                },
            ],
        },
        null,
        2
    ) + "\n",
    "utf8"
);

const sizes = [];
for (const name of [...pages.map(p => p.to), "omd.browser.js"]) {
    const content = await readFile(path.join(outDir, name));
    sizes.push(`${name} ${(content.length / 1024).toFixed(0)}KB`);
}

// Fail loudly if any page still references the repo-relative bundle.
for (const page of pages) {
    const html = await readFile(path.join(outDir, page.to), "utf8");
    if (html.includes("../../dist/")) throw new Error(`${page.to} still imports from ../../dist/`);
    if (!html.includes("./omd.browser.js")) throw new Error(`${page.to} has no bundle import`);
}

console.log("site ->", path.relative(process.cwd(), outDir));
console.log(sizes.join("  |  "));
