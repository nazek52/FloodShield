import { simulate, CELLS } from "./model.js";
export function simulateInterventions(parameters, ids = []) {
  const clean = simulate(parameters).parameters;
  if (
    !Array.isArray(ids) ||
    ids.some((id) => !Number.isInteger(id) || !CELLS.some((c) => c.id === id))
  )
    throw new Error("Invalid intervention site");
  const selected = new Set(ids);
  if (!selected.size) return simulate(clean);
  // Express effective local drain rates directly; the kernel scales them by 100%.
  const cells = CELLS.map((c) => ({
    ...c,
    drain: c.drain * (selected.has(c.id) ? 1 : clean.drainage / 100),
  }));
  const result = simulate({ ...clean, drainage: 100 }, cells);
  return {
    ...result,
    parameters: clean,
    interventions: [...selected],
    drainageInterpretation:
      "Per-site effective rate; selected sites restored to synthetic design capacity",
  };
}
export function prioritize(result, reports) {
  const blocked = new Set(
    reports
      .filter((r) => r.status === "confirmed" && r.type === "blocked_drain")
      .map((r) => r.cellId),
  );
  return [...result.cells].sort(
    (a, b) =>
      Number(blocked.has(b.id)) - Number(blocked.has(a.id)) ||
      b.index - a.index ||
      b.incoming - a.incoming ||
      a.id - b.id,
  );
}
