import test from "node:test";
import assert from "node:assert/strict";
import { simulate, DEFAULTS, CELLS } from "../dist/model.js";
test("water volume is conserved across parameter grid", () => {
  for (const rain of [0, 10, 45, 100, 150])
    for (const saturation of [0, 50, 100])
      for (const drainage of [0, 65, 100]) {
        const r = simulate({ ...DEFAULTS, rain, saturation, drainage });
        assert.ok(Math.abs(r.totals.balanceError) < 1e-7);
        assert.ok(
          r.cells.every(
            (c) => c.retained >= 0 && c.drained >= 0 && c.overflow >= 0,
          ),
        );
      }
});
test("no precipitation produces no modeled water", () => {
  const r = simulate({ ...DEFAULTS, rain: 0 });
  assert.equal(r.totals.input, 0);
  assert.ok(r.cells.every((c) => c.index === 0));
});
test("increased rainfall does not reduce retained plus escaped water", () => {
  let previous = -1;
  for (let rain = 0; rain <= 150; rain += 5) {
    const r = simulate({ ...DEFAULTS, rain });
    const v = r.totals.retained + r.totals.outflow;
    assert.ok(v >= previous - 1e-8);
    previous = v;
  }
});
test("saturation reduces infiltration", () =>
  assert.ok(
    simulate({ ...DEFAULTS, saturation: 100 }).totals.infiltration <
      simulate({ ...DEFAULTS, saturation: 0 }).totals.infiltration,
  ));
test("working drainage lowers surface water", () => {
  const a = simulate({ ...DEFAULTS, drainage: 0 }).totals;
  const b = simulate({ ...DEFAULTS, drainage: 100 }).totals;
  assert.ok(b.retained + b.outflow < a.retained + a.outflow);
});
test("flow paths strictly descend and cannot cycle", () => {
  for (const c of simulate(DEFAULTS).cells)
    if (c.downstream !== null)
      assert.ok(CELLS[c.downstream].elevation < c.elevation);
});
test("invalid and missing inputs are rejected", () => {
  for (const p of [
    { ...DEFAULTS, rain: -1 },
    { ...DEFAULTS, rain: "45" },
    { ...DEFAULTS, duration: 0 },
    { ...DEFAULTS, saturation: NaN },
    { rain: 2 },
    { ...DEFAULTS, rain: 151 },
  ])
    assert.throws(() => simulate(p));
});
test("repeatability, immutable inputs and transparent provenance", () => {
  assert.deepEqual(simulate(DEFAULTS), simulate(DEFAULTS));
  assert.equal(simulate(DEFAULTS).provenance, "synthetic");
  assert.equal(CELLS[0].incoming, undefined);
});

const cell = (overrides = {}) => ({
  id: 0,
  name: "test",
  x: 0,
  y: 0,
  area: 1000,
  elevation: 10,
  impervious: 1,
  infiltration: 0,
  storage: 10,
  drain: 0,
  ...overrides,
});
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("a single cell has independently calculable event accounting", () => {
  const r = simulate(
    { ...DEFAULTS, rain: 40, duration: 2, saturation: 0, drainage: 100 },
    [cell({ impervious: 0.5, infiltration: 10, drain: 5 })],
  );
  assert.deepEqual(r.totals, {
    input: 40,
    infiltration: 10,
    drainage: 10,
    retained: 10,
    outflow: 10,
    balanceError: 0,
  });
});

test("routed overflow is neither lost nor counted as new rainfall", () => {
  const r = simulate({ ...DEFAULTS, rain: 40 }, [
    cell(),
    cell({ id: 7, x: 1, elevation: 0, storage: 100 }),
  ]);
  assert.equal(r.cells[0].downstream, 7);
  close(r.cells[1].incoming, 30);
  close(r.cells[1].retained, 70);
  close(r.totals.input, 80);
  close(r.totals.retained, 80);
  close(r.totals.outflow, 0);
  for (const c of r.cells)
    close(
      (r.parameters.rain / 1000) * c.area + c.incoming,
      c.infiltrated + c.drained + c.retained + c.overflow,
    );
});

test("zero storage passes water through with a finite index, including no rain", () => {
  for (const rain of [0, 40]) {
    const r = simulate({ ...DEFAULTS, rain }, [cell({ storage: 0 })]);
    close(r.totals.retained, 0);
    close(r.totals.outflow, rain);
    assert.ok(Number.isFinite(r.cells[0].index));
  }
});

test("equal-height neighbors cannot receive modeled downhill flow", () => {
  const r = simulate({ ...DEFAULTS, rain: 40 }, [
    cell(),
    cell({ id: 1, x: 1 }),
  ]);
  assert.ok(r.cells.every((c) => c.downstream === null && c.incoming === 0));
  close(r.totals.outflow, 60);
});

test("topological processing is independent of supplied array order", () => {
  const cells = [
    cell(),
    cell({ id: 2, x: 1, elevation: 5 }),
    cell({ id: 8, x: 2, elevation: 0 }),
  ];
  const a = simulate(DEFAULTS, cells),
    b = simulate(DEFAULTS, [...cells].reverse());
  assert.deepEqual(a.totals, b.totals);
  assert.deepEqual(
    [...a.cells].sort((a, b) => a.id - b.id),
    [...b.cells].sort((a, b) => a.id - b.id),
  );
});

test("invalid cell inputs are rejected instead of emitting NaN or negative water", () => {
  for (const cells of [
    null,
    {},
    [],
    [null],
    [cell({ area: 0 })],
    [cell({ area: -1 })],
    [cell({ storage: -1 })],
    [cell({ impervious: 1.1 })],
    [cell({ infiltration: -1 })],
    [cell({ drain: -1 })],
    [cell({ elevation: Infinity })],
    [cell({ x: 0.5 })],
    [cell({ id: "0" })],
    [cell(), cell({ x: 1 })],
    [cell(), cell({ id: 1 })],
  ]) {
    assert.throws(() => simulate(DEFAULTS, cells));
  }
  assert.throws(() =>
    simulate(
      { ...DEFAULTS, rain: 150 },
      Array.from({ length: 8 }, (_, id) =>
        cell({ id, x: id, area: Number.MAX_VALUE }),
      ),
    ),
  );
});

test("neither custom cells nor scenario parameters are mutated", () => {
  const custom = [
    Object.freeze(cell()),
    Object.freeze(cell({ id: 1, x: 1, elevation: 0 })),
  ];
  const before = JSON.stringify(custom);
  simulate(Object.freeze({ ...DEFAULTS }), Object.freeze(custom));
  assert.equal(JSON.stringify(custom), before);
});

test("increasing rain never reduces each cell surface indicator on default geometry", () => {
  let previous = simulate({ ...DEFAULTS, rain: 0 });
  for (let rain = 5; rain <= 150; rain += 5) {
    const current = simulate({ ...DEFAULTS, rain });
    for (let i = 0; i < CELLS.length; i++) {
      assert.ok(current.cells[i].retained >= previous.cells[i].retained - 1e-8);
      assert.ok(current.cells[i].overflow >= previous.cells[i].overflow - 1e-8);
      assert.ok(current.cells[i].index >= previous.cells[i].index);
    }
    previous = current;
  }
});

test("longer event at fixed rainfall and more effective drainage cannot increase remaining water", () => {
  for (const rain of [10, 45, 150])
    for (const saturation of [0, 50, 100]) {
      for (const control of ["duration", "drainage"]) {
        let previous = Infinity;
        for (const value of control === "duration"
          ? [0.1, 1, 3, 6, 12]
          : [0, 25, 50, 75, 100]) {
          const r = simulate({
            ...DEFAULTS,
            rain,
            saturation,
            [control]: value,
          });
          const surface = r.totals.retained + r.totals.outflow;
          assert.ok(surface <= previous + 1e-8);
          previous = surface;
        }
      }
    }
});

test("only supported scenario controls are returned", () => {
  assert.deepEqual(
    simulate({ ...DEFAULTS, unexpected: "ignored" }).parameters,
    DEFAULTS,
  );
  for (const input of [null, undefined, [], false])
    assert.throws(() => simulate(input));
});
