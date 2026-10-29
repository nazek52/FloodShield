import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
// Build from current source first so `npm test` never accidentally tests an old artifact.
execFileSync(process.execPath, ["scripts/build.mjs"]);
const { default: worker } = await import(
  "../dist/server/index.js?" + Date.now()
);
test("built Worker serves complete app and source-backed historical data", async () => {
  for (const path of [
    "/",
    "/app.js",
    "/model.js",
    "/decisions.js",
    "/site-names.js",
    "/style.css",
    "/data/valencia.json",
  ]) {
    const r = await worker.fetch(
      new Request("https://example.test" + path),
      {},
    );
    assert.equal(r.status, 200, path);
    assert.ok((await r.text()).length > 100);
    assert.equal(r.headers.get("X-Content-Type-Options"), "nosniff");
  }
  const j = await (
    await worker.fetch(
      new Request("https://example.test/data/valencia.json"),
      {},
    )
  ).json();
  assert.equal(j.metadata.counts.flood_trace, 37);
  assert.equal(j.metadata.observation_time, "2024-11-17T13:21:00Z");
  assert.equal(
    j.features.filter((f) => f.properties.layer === "building").length,
    16,
  );
});
test("deployed artifact exposes real unavailable status, never fake AI output", async () => {
  const status = await worker.fetch(
    new Request("https://example.test/api/status"),
    {},
  );
  assert.deepEqual(await status.json(), { configured: false });
  const r = await worker.fetch(
    new Request("https://example.test/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Upper Street drain blocked" }),
    }),
    {},
  );
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, "meta_not_configured");
});
test("artifact rejects missing paths and unsupported asset methods", async () => {
  assert.equal(
    (await worker.fetch(new Request("https://example.test/no-such-file"), {}))
      .status,
    404,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://example.test/", { method: "POST" }),
        {},
      )
    ).status,
    405,
  );
});
