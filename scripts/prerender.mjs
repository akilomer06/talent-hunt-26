import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import {
  render,
  publicRoutes,
  metadata,
  validateSiteData,
  siteData,
} from "../.prerender/entry-server.js";
const errors = validateSiteData();
if (errors.length) throw new Error(errors.join("\n"));
const template = await readFile("dist/index.html", "utf8");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const routes = [...publicRoutes, "/404"];
for (const path of routes) {
  const meta = metadata(path);
  const absolute = (value) =>
    siteData.settings.productionUrl
      ? new URL(value, siteData.settings.productionUrl).href
      : value;
  const head = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escape(siteData.settings.title)}">`,
    `<meta property="og:title" content="${escape(meta.title)}">`,
    `<meta property="og:description" content="${escape(meta.description)}">`,
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escape(meta.title)}">`,
    `<meta name="twitter:description" content="${escape(meta.description)}">`,
    `<link rel="icon" type="image/png" href="${escape(siteData.assets.favicon)}">`,
  ];
  if (meta.image)
    head.push(
      `<meta property="og:image" content="${escape(absolute(meta.image))}">`,
      `<meta name="twitter:image" content="${escape(absolute(meta.image))}">`,
    );
  if (meta.noindex) head.push('<meta name="robots" content="noindex">');
  if (siteData.settings.productionUrl && !meta.noindex)
    head.push(
      `<link rel="canonical" href="${escape(absolute(path))}">`,
      `<meta property="og:url" content="${escape(absolute(path))}">`,
    );
  const dir = path === "/" ? "dist" : `dist${path}`;
  await mkdir(dir, { recursive: true });
  await writeFile(
    `${dir}/index.html`,
    template
      .replace("<!--head-->", head.join("\n"))
      .replace("<!--app-->", render(path)),
  );
}
await copyFile("dist/404/index.html", "dist/404.html");
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\n${siteData.settings.productionUrl ? `Sitemap: ${new URL("/sitemap.xml", siteData.settings.productionUrl).href}\n` : ""}`,
);
if (siteData.settings.productionUrl)
  await writeFile(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.map((p) => `<url><loc>${escape(new URL(p, siteData.settings.productionUrl).href)}</loc></url>`).join("")}</urlset>`,
  );
await writeFile(
  "vercel.json",
  JSON.stringify(
    {
      framework: null,
      buildCommand: "npm run build",
      outputDirectory: "dist",
      routes: [
        ...publicRoutes
          .filter((p) => p !== "/")
          .map((p) => ({ src: `^${p}/?$`, dest: `${p}/index.html` })),
        { handle: "filesystem" },
        { src: "/(.*)", status: 404, dest: "/404.html" },
      ],
    },
    null,
    2,
  ) + "\n",
);
await mkdir("public/licenses", { recursive: true });
for (const name of ["barlow", "barlow-condensed"]) {
  await copyFile(
    `node_modules/@fontsource/${name}/LICENSE`,
    `public/licenses/${name}-OFL.txt`,
  );
  await mkdir("dist/licenses", { recursive: true });
  await copyFile(
    `public/licenses/${name}-OFL.txt`,
    `dist/licenses/${name}-OFL.txt`,
  );
}
await writeFile("dist/route-manifest.json", JSON.stringify(routes, null, 2));
console.log(
  `Prerendered ${routes.length} pages (${publicRoutes.length} public routes + 404). Vercel routes generated from siteData.`,
);
