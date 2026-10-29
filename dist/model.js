export const VERSION = "0.2.0";
export const DEFAULTS = Object.freeze({
  rain: 45,
  duration: 3,
  saturation: 45,
  drainage: 65,
});
const names = [
  "Северный парк",
  "Школьный квартал",
  "Верхняя улица",
  "Северный склон",
  "Тихий проезд",
  "Восточная окраина",
  "Садовый квартал",
  "Спортивный центр",
  "Рыночная площадь",
  "Речной проезд",
  "Нижний парк",
  "Восточный склон",
  "Западный сквер",
  "Жилой квартал",
  "Перекрёсток",
  "Низина у моста",
  "Южная низина",
  "Выход водосбора",
];
export const CELLS = Object.freeze(
  names.map((name, i) =>
    Object.freeze({
      id: i,
      name,
      x: i % 6,
      y: Math.floor(i / 6),
      area: 10000,
      elevation: 128 - (i % 6) * 3 - Math.floor(i / 6) * 5 + (i === 9 ? -4 : 0),
      impervious: [
        0.15, 0.65, 0.8, 0.3, 0.7, 0.2, 0.25, 0.65, 0.9, 0.8, 0.1, 0.3, 0.2,
        0.6, 0.85, 0.75, 0.5, 0.2,
      ][i],
      infiltration: 9,
      storage: [
        12, 15, 12, 20, 15, 12, 18, 18, 22, 40, 35, 20, 20, 25, 30, 65, 55, 45,
      ][i],
      drain: [1, 5, 6, 2, 4, 2, 1, 5, 7, 3, 1, 2, 1, 5, 6, 2, 2, 8][i],
    }),
  ),
);
export function validate(p) {
  if (!p || typeof p !== "object" || Array.isArray(p))
    throw new Error("Ожидался объект параметров");
  for (const [k, max] of Object.entries({
    rain: 150,
    duration: 12,
    saturation: 100,
    drainage: 100,
  })) {
    if (
      typeof p[k] !== "number" ||
      !Number.isFinite(p[k]) ||
      p[k] < 0 ||
      p[k] > max ||
      (k === "duration" && p[k] === 0)
    ) {
      throw new Error("Недопустимый параметр: " + k);
    }
  }
  return p;
}

function validateCells(cells) {
  if (!Array.isArray(cells) || cells.length === 0)
    throw new Error("Нужен непустой массив участков");
  const ids = new Set(),
    coordinates = new Set();
  for (const c of cells) {
    if (!c || typeof c !== "object" || Array.isArray(c))
      throw new Error("Некорректный участок");
    if (!Number.isSafeInteger(c.id) || c.id < 0 || ids.has(c.id))
      throw new Error("Некорректный или повторный id участка");
    if (!Number.isSafeInteger(c.x) || !Number.isSafeInteger(c.y))
      throw new Error("Некорректные координаты участка");
    const position = `${c.x},${c.y}`;
    if (coordinates.has(position))
      throw new Error("Повторные координаты участка");
    ids.add(c.id);
    coordinates.add(position);
    for (const key of [
      "area",
      "elevation",
      "impervious",
      "infiltration",
      "storage",
      "drain",
    ]) {
      if (typeof c[key] !== "number" || !Number.isFinite(c[key]))
        throw new Error("Некорректное поле участка: " + key);
    }
    if (
      c.area <= 0 ||
      c.impervious < 0 ||
      c.impervious > 1 ||
      c.infiltration < 0 ||
      c.storage < 0 ||
      c.drain < 0
    ) {
      throw new Error("Параметры участка выходят за допустимые пределы");
    }
  }
}

export function simulate(params, cells = CELLS) {
  validate(params);
  // Only supported scenario controls are returned: persisted input cannot add arbitrary UI keys.
  const p = Object.fromEntries(
    Object.keys(DEFAULTS).map((key) => [key, params[key]]),
  );
  validateCells(cells);
  const rows = cells.map((c) => ({
    ...c,
    incoming: 0,
    infiltrated: 0,
    drained: 0,
    retained: 0,
    overflow: 0,
    index: 0,
    downstream: null,
  }));
  const order = [...rows].sort(
    (a, b) => b.elevation - a.elevation || a.id - b.id,
  );
  let input = 0,
    infiltration = 0,
    drainage = 0,
    retained = 0,
    outflow = 0;
  for (const c of order) {
    const rain = (p.rain / 1000) * c.area;
    input += rain;
    // Toy event model: infiltration applies to local rainfall only, not routed inflow.
    const absorptionDepth =
      c.infiltration *
      (1 - c.impervious) *
      (1 - p.saturation / 100) *
      p.duration;
    c.infiltrated = (Math.min(p.rain, absorptionDepth) / 1000) * c.area;
    infiltration += c.infiltrated;
    let water = rain - c.infiltrated + c.incoming;
    const drainCapacity =
      c.drain * (p.drainage / 100) * p.duration * (c.area / 1000);
    c.drained = Math.min(water, drainCapacity);
    drainage += c.drained;
    water -= c.drained;
    c.retained = Math.min(water, (c.storage / 1000) * c.area);
    retained += c.retained;
    c.overflow = Math.max(0, water - c.retained);
    c.layer = (c.retained / c.area) * 1000;
    // Zero storage is valid: all remaining water passes through; avoid 0/0.
    const storageFraction =
      c.storage > 0 ? c.retained / ((c.storage / 1000) * c.area) : 0;
    c.index = Math.min(
      100,
      Math.round(
        storageFraction * 60 + (((c.overflow / c.area) * 1000) / 80) * 40,
      ),
    );
    c.level = c.index >= 70 ? "high" : c.index >= 35 ? "medium" : "low";
    const neighbors = rows
      .filter(
        (n) =>
          Math.abs(n.x - c.x) + Math.abs(n.y - c.y) === 1 &&
          n.elevation < c.elevation,
      )
      .sort((a, b) => a.elevation - b.elevation || a.id - b.id);
    if (neighbors.length) {
      c.downstream = neighbors[0].id;
      neighbors[0].incoming += c.overflow;
    } else outflow += c.overflow;
  }
  if (
    ![input, infiltration, drainage, retained, outflow].every(
      Number.isFinite,
    ) ||
    rows.some(
      (c) =>
        ![
          c.incoming,
          c.infiltrated,
          c.drained,
          c.retained,
          c.overflow,
          c.layer,
          c.index,
        ].every(Number.isFinite),
    )
  ) {
    throw new Error("Масштаб данных превышает численные пределы модели");
  }
  return {
    modelVersion: VERSION,
    provenance: "synthetic",
    parameters: p,
    cells: rows,
    totals: {
      input,
      infiltration,
      drainage,
      retained,
      outflow,
      balanceError: input - infiltration - drainage - retained - outflow,
    },
    highCount: rows.filter((c) => c.level === "high").length,
  };
}
