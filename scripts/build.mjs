import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
// A zero-dependency ESM Worker: source assets are embedded at build time, never fetched from a third party.
const assets = {};
async function collect(dir, prefix = "") {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === "server" || e.name === ".openai") continue;
    const p = path.join(dir, e.name),
      url = prefix + "/" + e.name;
    if (e.isDirectory()) await collect(p, url);
    else assets[url] = await readFile(p, "utf8");
  }
}
await collect("dist");
let model = await readFile("dist/model.js", "utf8"),
  names = await readFile("dist/site-names.js", "utf8"),
  meta = await readFile("server/meta.js", "utf8");
meta = meta.replace(/^import .*;\n/gm, "");
const source =
  model +
  "\n" +
  names +
  "\n" +
  meta +
  "\nconst ASSETS=" +
  JSON.stringify(assets) +
  ";\n" +
  `export default {async fetch(request,env){const u=new URL(request.url);if(u.pathname.startsWith('/api/'))return apiHandler(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const key=u.pathname==='/'?'/index.html':u.pathname;const content=ASSETS[key];if(content===undefined)return new Response('Not found',{status:404});const ext=key.split('.').at(-1);const types={html:'text/html',js:'text/javascript',css:'text/css',json:'application/json'};return new Response(request.method==='HEAD'?null:content,{headers:{'Content-Type':(types[ext]||'text/plain')+'; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache'}});}};`;
await mkdir("dist/server", { recursive: true });
await writeFile("dist/server/index.js", source);
await mkdir("dist/.openai", { recursive: true });
await writeFile(
  "dist/.openai/hosting.json",
  await readFile(".openai/hosting.json"),
);
console.log(
  "Built self-contained Worker and embedded " +
    Object.keys(assets).length +
    " assets.",
);
