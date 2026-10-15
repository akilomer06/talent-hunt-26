import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import {
  publicRoutes,
  metadata,
  siteData,
} from "../.prerender/entry-server.js";
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const titles = new Set();
const links = new Set();
for (const route of [...publicRoutes, "/404"]) {
  const html = await readFile(
    `dist${route === "/" ? "" : route}/index.html`,
    "utf8",
  );
  const meta = metadata(route);
  assert.ok(
    html.includes(`<title>${escape(meta.title)}</title>`),
    `Title ${route}`,
  );
  assert.ok(
    html.includes(`name="description" content="${escape(meta.description)}"`),
    `Description ${route}`,
  );
  assert.ok(
    html.includes(`property="og:title" content="${escape(meta.title)}"`),
  );
  assert.ok(html.includes('name="twitter:description"'));
  assert.ok(html.includes("<h1"), `Static content ${route}`);
  assert.ok(!html.includes("<!--app-->"));
  assert.ok(!titles.has(meta.title), `Unique title ${route}`);
  titles.add(meta.title);
  const event = siteData.events.find((e) => route === `/events/${e.slug}`);
  if (event) assert.ok(html.includes(event.name), `Event content ${route}`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g))
    links.add(match[1]);
}
for (const link of links) {
  if (publicRoutes.includes(link) || link === "/404") continue;
  await access(`dist${link}`);
}
const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
assert.equal(vercel.routes.at(-1).status, 404);
assert.equal(vercel.outputDirectory, "dist");
assert.equal(vercel.routes.length, publicRoutes.length + 1);
console.log(
  `Verified ${titles.size} unique titles, static content, descriptions, OG/Twitter tags, ${links.size} local links/assets and Vercel routes.`,
);
