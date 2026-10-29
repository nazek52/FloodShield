import test from "node:test";
import assert from "node:assert/strict";
import { simulate, DEFAULTS, CELLS } from "../dist/model.js";
import { simulateInterventions, prioritize } from "../dist/decisions.js";
test("no intervention exactly preserves original calculation", () =>
  assert.deepEqual(simulateInterventions(DEFAULTS), simulate(DEFAULTS)));
test("clearance retains original inputs even at zero network capacity", () => {
  const p = { ...DEFAULTS, drainage: 0 };
  const r = simulateInterventions(p, [15]);
  assert.deepEqual(r.parameters, p);
  assert.ok(r.cells.find((c) => c.id === 15).drained > 0);
  assert.ok(r.cells.filter((c) => c.id !== 15).every((c) => c.drained === 0));
  assert.ok(Math.abs(r.totals.balanceError) < 1e-7);
});
test("clearance never increases retained plus exported water on scenario grid", () => {
  for (const rain of [0, 45, 100, 150])
    for (const drainage of [0, 25, 65, 100]) {
      const p = { ...DEFAULTS, rain, drainage },
        a = simulate(p),
        b = simulateInterventions(p, [0, 15]);
      assert.ok(
        b.totals.retained + b.totals.outflow <=
          a.totals.retained + a.totals.outflow + 1e-7,
      );
      assert.equal(a.totals.input, b.totals.input);
      assert.equal(a.totals.infiltration, b.totals.infiltration);
    }
});
test("clearing a fully functional network has no numeric benefit", () => {
  const p = { ...DEFAULTS, drainage: 100 },
    a = simulate(p),
    b = simulateInterventions(p, [15]);
  assert.deepEqual(a.totals, b.totals);
});
test("unknown intervention sites rejected and input data untouched", () => {
  assert.throws(() => simulateInterventions(DEFAULTS, [999]));
  assert.throws(() => simulateInterventions(DEFAULTS, ["15"]));
  const before = JSON.stringify(CELLS);
  simulateInterventions(DEFAULTS, [15]);
  assert.equal(JSON.stringify(CELLS), before);
});
test("only confirmed blocked drains promote worklist, never change model score", () => {
  const r = simulate(DEFAULTS),
    scores = r.cells.map((c) => c.index),
    draft = { cellId: 0, type: "blocked_drain", status: "draft" };
  assert.deepEqual(prioritize(r, [draft]), prioritize(r, []));
  assert.equal(prioritize(r, [{ ...draft, status: "confirmed" }])[0].id, 0);
  assert.deepEqual(
    prioritize(r, [{ ...draft, type: "surface_water", status: "confirmed" }]),
    prioritize(r, []),
  );
  assert.deepEqual(
    r.cells.map((c) => c.index),
    scores,
  );
});
