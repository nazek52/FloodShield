import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { apiHandler } from "../server/meta.js";
const port = Number(process.env.PORT || 4173);
const types = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
  json: "application/json",
};
createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname.startsWith("/api/")) {
      const buffers = [];
      let length = 0;
      for await (const b of req) {
        length += b.length;
        if (length > 30000) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end('{"error":"body_too_large"}');
          return;
        }
        buffers.push(b);
      }
      const request = new Request("http://localhost" + req.url, {
        method: req.method,
        headers: req.headers,
        ...(["GET", "HEAD"].includes(req.method)
          ? {}
          : { body: Buffer.concat(buffers) }),
      });
      const response = await apiHandler(request, process.env);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const p = decodeURIComponent(
      u.pathname === "/" ? "/index.html" : u.pathname,
    );
    if (p.includes("..") || p.includes("\\") || p.includes("\0")) {
      res.writeHead(400);
      res.end();
      return;
    }
    const data = await readFile(new URL("../dist" + p, import.meta.url));
    res.writeHead(200, {
      "Content-Type":
        (types[p.split(".").at(-1)] || "text/plain") + "; charset=utf-8",
    });
    res.end(req.method === "HEAD" ? null : data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "0.0.0.0", () =>
  console.log("FloodShield dev server on port " + port),
);
