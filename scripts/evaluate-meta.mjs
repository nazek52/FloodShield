import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { analyzeReport } from "../server/meta.js";

// Explicit opt-in only: never a CI task or an automatic test-suite side effect.
const args = process.argv.slice(2);
if (!args.includes("--live")) {
  console.error("Live evaluation requires --live and a server-side MODEL_API_KEY. Default: 3 requests. Use --cases=N (1–12) to choose a bounded run. No automatic retries.");
  process.exit(2);
}
const countArg = args.find((arg) => arg.startsWith("--cases="));
const count = countArg ? Number(countArg.slice(8)) : 3;
if (!Number.isSafeInteger(count) || count < 1 || count > 12 || args.some((arg) => arg !== "--live" && arg !== countArg)) {
  console.error("Invalid arguments. Use --live [--cases=N], N between 1 and 12.");
  process.exit(2);
}
if (!(process.env.MODEL_API_KEY || process.env.META_API_KEY)?.trim()) {
  console.error("Missing server-side Meta key. No requests made.");
  process.exit(2);
}
const notes = JSON.parse(await readFile(fileURLToPath(new URL("../tests/fixtures/meta-notes.json", import.meta.url)), "utf8"));
let passed = 0, promptTokens = 0, completionTokens = 0;
const rows = [];
for (const note of notes.slice(0, count)) {
  try {
    const result = await analyzeReport({ text: note.text }, process.env);
    const actual = [...new Set(result.observations.map((o) => JSON.stringify([o.cellId, o.type])))].sort();
    const expected = note.expected.map((pair) => JSON.stringify(pair)).sort();
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
      && (!note.question || result.questions.length > 0)
      && !(note.forbidden || []).some((pair) => actual.includes(JSON.stringify(pair)));
    passed += Number(ok);
    promptTokens += result.usage.prompt_tokens || 0;
    completionTokens += result.usage.completion_tokens || 0;
    rows.push({ id: note.id, passed: ok, model: result.model, elapsedMs: result.elapsedMs, actual, questionCount: result.questions.length, usage: result.usage });
  } catch (error) {
    // Provider messages may contain secrets: expose only our adapter's fixed error code.
    rows.push({ id: note.id, passed: false, error: error.code || "evaluation_failed" });
  }
}
console.log(JSON.stringify({ suite: "authored regression fixtures, not independent validation", timestamp: new Date().toISOString(), requests: count, passed, promptTokens, completionTokens, rows }, null, 2));
process.exitCode = passed === count ? 0 : 1;
