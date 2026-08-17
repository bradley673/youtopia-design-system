// Inline the built JS + CSS into a single self-contained HTML file.
// Produces dist/youtopia-practice.html alongside the normal Vite output.
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve(import.meta.dirname, "../dist");
let html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

html = html.replace(/<script type="module"[^>]*src="\.?\/?(assets\/[^"]+\.js)"[^>]*><\/script>/, (_, src) => {
  const js = fs.readFileSync(path.join(dist, src), "utf8").replace(/<\/script/g, "<\\/script");
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet"[^>]*href="\.?\/?(assets\/[^"]+\.css)"[^>]*>/, (_, href) => {
  const css = fs.readFileSync(path.join(dist, href), "utf8");
  return `<style>${css}</style>`;
});

const out = path.join(dist, "youtopia-practice.html");
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
