import { simulate, DEFAULTS, CELLS } from "./model.js";
import { simulateInterventions, prioritize } from "./decisions.js";
import { EN_NAMES } from "./site-names.js";
const $ = (id) => document.getElementById(id),
  fmt = (n) =>
    new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-GB", {
      maximumFractionDigits: 0,
    }).format(n),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const ru = {
  eyebrow: "ПОДДЕРЖКА РЕШЕНИЙ · ИССЛЕДОВАТЕЛЬСКИЙ ПРОТОТИП",
  title: "От сигналов затопления<br>к проверке на месте.",
  subtitle:
    "Изучите накопление воды. Проверьте свидетельства.<br>Сравните эффект очистки дренажа до выезда бригады.",
  guided: "Демонстрация за 60 секунд",
  export: "Скачать пакет свидетельств",
  noClaims: "Исследовательская модель. Не экстренное оповещение.",
  prioritySites: "Участки высокого приоритета",
  surface: "Удержано на поверхности",
  surfaceSub: "Расчётный объём в пределах водосбора",
  fieldEvidence: "Подтверждённые сообщения",
  evidenceSub: "В очередь попадают только проверенные человеком сообщения",
  balance: "Баланс воды",
  conditions: "Задайте условия",
  reset: "Сбросить",
  scenario: "Сценарий осадков",
  rain: "Осадки за событие",
  duration: "Длительность дождя",
  saturation: "Насыщение грунта",
  drainage: "Мощность дренажной сети",
  dry: "Сухой",
  wet: "Насыщенный",
  scenarioHelp:
    "Параметры условные. Меняйте один фактор и исследуйте реакцию модели.",
  save: "Сохранить",
  restore: "Восстановить",
  district: "Условный водосбор «Речной»",
  mapSub: "18 синтетических участков · по 1 гектару",
  synthetic: "УСЛОВНАЯ ГЕОМЕТРИЯ",
  mapCaption: "Выберите участок для просмотра свидетельств",
  low: "Низкий",
  medium: "Наблюдать",
  high: "Проверить первым",
  legend: "Приоритет обследования, не вероятность",
  flow: "Направления стока",
  labels: "Индексы участков",
  baseline: "Зафиксировать сравнение",
  indexHelp: "Исследовательский индекс.<br>Не вероятность затопления.",
  drivers: "Что влияет на результат",
  actionTitle: "Восстановить дренаж участка",
  actionHelp: "Сравните тот же дождь с дренажем на полной проектной мощности.",
  intervene: "Проверить очистку дренажа →",
  undo: "Отменить эту очистку",
  comparisonTitle: "Что изменится после вмешательства?",
  before: "До",
  after: "После",
  siteIndex: "индекс участка",
  changeHelp:
    "Изменение удержанного объёма + выхода за границы. Расчёт, не измеренный эффект.",
  reportTitle: "Превратите сообщение в проверяемое наблюдение",
  reportHelp:
    "Meta извлекает наблюдение с точной цитатой. Человек проверяет его до добавления в очередь обследования.",
  reportText: "Полевое сообщение",
  sample: "Пример сообщения",
  analyze: "Разобрать через Meta ↗",
  manual: "Проверить вручную / работать без API-ключа",
  site: "Участок",
  observation: "Наблюдение",
  addManual: "Добавить черновик на проверку",
  queue: "Проверить эти участки первыми",
  queueHelp:
    "Сначала подтверждённые сообщения о засоре, затем индекс модели. Это прозрачное правило, а не оптимальный маршрут.",
  queueNote:
    "Сообщения — свидетельства, они не изменяют гидрологические параметры автоматически.",
  historyTitle: "Валенсия, октябрь 2024",
  historyHelp:
    "Реальные исторические свидетельства, отдельно от условного сценария. Следы затопления не являются прогнозом или текущими границами воды.",
  source: "Официальный источник ↗",
  footer:
    "Условная модель + отдельные исторические свидетельства. Не система предупреждений.",
  readiness: "Готовность к хакатону ↗",
  methodTitle: "Возможности и ограничения прототипа",
  understood: "Понятно",
};
const english = {};
document
  .querySelectorAll("[data-i18n]")
  .forEach((el) => (english[el.dataset.i18n] = el.innerHTML));
let lang = "en",
  params = { ...DEFAULTS },
  selected = 15,
  zoom = 1,
  interventions = new Set(),
  reports = [],
  baseline = simulate(DEFAULTS),
  result = baseline,
  unmodified = baseline,
  configured = false,
  tourStep = -1,
  historyData = null,
  activeView = "lab",
  historyFocusId = "";
const presetValues = {
  base: { ...DEFAULTS },
  storm: { rain: 100, duration: 2, saturation: 60, drainage: 65 },
  stress: { rain: 45, duration: 6, saturation: 60, drainage: 25 },
  saturated: { rain: 65, duration: 4, saturation: 95, drainage: 25 },
  dry: { rain: 0, duration: 3, saturation: 45, drainage: 65 },
};
const choose = (en, ru) => (lang === "ru" ? ru : en),
  name = (id) => (lang === "ru" ? CELLS[id].name : EN_NAMES[id]),
  typeName = (type) =>
    ({
      blocked_drain: choose("Blocked drain", "Засор дренажа"),
      surface_water: choose("Surface water", "Вода на поверхности"),
      no_issue: choose("No issue observed", "Проблема не отмечена"),
      unknown: choose("Needs verification", "Требует проверки"),
    })[type];
const scoreName = (l) =>
  ({
    high: choose("Inspect first", "Проверить первым"),
    medium: choose("Watch", "Наблюдать"),
    low: choose("Low priority", "Низкий приоритет"),
  })[l];
function compute() {
  return simulateInterventions(params, [...interventions]);
}
function position(c) {
  return [103 + c.x * 109 + c.y * 11, 139 + c.y * 129 - c.x * 4];
}
function drawMap() {
  const colors = { low: "#408879", medium: "#bda268", high: "#c47b68" };
  let s = `<defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#28404c" stroke-width=".5" opacity=".4"/></pattern><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="#65abb4"/></marker><pattern id="water" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0V12" stroke="#699b9470" stroke-width="1"/></pattern></defs><rect width="850" height="610" fill="#142732"/><rect width="850" height="610" fill="url(#grid)"/><path d="M800 -20C670 90 850 185 753 294S724 430 814 630" stroke="#234957" stroke-width="59" fill="none"/><path d="M800 -20C670 90 850 185 753 294S724 430 814 630" stroke="#2b5764" stroke-width="36" fill="none"/><path d="M72 90Q360 32 711 82M50 229Q355 168 714 202M50 366Q355 306 719 334M55 496Q355 448 734 464M160 80L218 500M380 65L435 500M600 55L655 500" stroke="#334956" stroke-width="10" fill="none"/><path d="M72 90Q360 32 711 82M50 229Q355 168 714 202M50 366Q355 306 719 334M55 496Q355 448 734 464M160 80L218 500M380 65L435 500M600 55L655 500" stroke="#45606b" stroke-width="1" stroke-dasharray="4 8" fill="none"/><text x="799" y="290" transform="rotate(82 799 290)" font-size="9" letter-spacing="4" fill="#6495a3">RIVER · NOT MODELED</text><text x="73" y="539" font-size="9" letter-spacing="3" fill="#4b6c7e">RIVERBEND · SCHEMATIC CATCHMENT</text>`;
  for (const c of result.cells) {
    const [x, y] = position(c),
      active = c.id === selected,
      verified = reports.some(
        (r) => r.cellId === c.id && r.status === "confirmed",
      );
    s += `<g class="parcel" role="button" tabindex="0" aria-label="${esc(name(c.id))}: ${scoreName(c.level)} ${c.index}" aria-pressed="${active}" data-cell="${c.id}"><rect class="cell-shape" x="${x - 39}" y="${y - 38}" width="85" height="83" rx="5" fill="${colors[c.level]}" fill-opacity=".21" stroke="${active ? "#73e7db" : colors[c.level]}" stroke-width="${active ? 2.5 : 1}"/>`;
    if (c.impervious > 0.5) {
      for (let b = 0; b < 5; b++)
        s += `<path d="M${x - 25 + (b % 3) * 23} ${y - 23 + Math.floor(b / 3) * 23}h15v14h-15Z" fill="#5e7b88" fill-opacity=".55" stroke="#91a4aa" stroke-width=".6"/>`;
    } else {
      for (let b = 0; b < 6; b++)
        s += `<circle cx="${x - 23 + (b % 3) * 23}" cy="${y - 21 + Math.floor(b / 3) * 22}" r="7" fill="#477469" stroke="#72987a" stroke-width=".6"/>`;
    }
    if (c.layer > 0)
      s += `<rect x="${x - 36}" y="${y + 34 - Math.min(35, c.layer / 2)}" width="79" height="${Math.min(35, c.layer / 2)}" rx="3" fill="url(#water)" opacity=".4"/>`;
    if ($("labels").checked)
      s += `<rect x="${x - 12}" y="${y + 13}" width="33" height="21" rx="4" fill="#112631"/><text x="${x + 4}" y="${y + 27}" text-anchor="middle" font-size="11" font-weight="700" fill="${active ? "#86efdd" : "#c2d3d9"}">${c.index}</text>`;
    if (verified)
      s += `<circle cx="${x + 40}" cy="${y - 32}" r="9" fill="#51cfc4" stroke="#142c36" stroke-width="2"/><text x="${x + 40}" y="${y - 29}" font-size="10" text-anchor="middle" fill="#0d3a3e">✓</text>`;
    if (interventions.has(c.id))
      s += `<rect x="${x - 42}" y="${y - 45}" width="25" height="17" rx="3" fill="#54d3cd"/><text x="${x - 30}" y="${y - 33}" text-anchor="middle" font-size="11" fill="#123940">↗</text>`;
    s += "</g>";
  }
  if ($("flow").checked)
    for (const c of result.cells) {
      if (c.downstream === null || c.overflow < 1) continue;
      const [x, y] = position(c),
        [nx, ny] = position(result.cells.find((n) => n.id === c.downstream));
      const dx = nx - x,
        dy = ny - y,
        d = Math.hypot(dx, dy);
      s += `<path d="M${x + (dx / d) * 47} ${y + (dy / d) * 47}L${nx - (dx / d) * 47} ${ny - (dy / d) * 47}" class="flow-line" stroke="#67a7b3" stroke-width="${Math.min(3.5, 1 + c.overflow / 1100)}" marker-end="url(#arrow)" fill="none"/>`;
    }
  $("map").innerHTML = s;
  const w = 850 / zoom,
    h = 610 / zoom;
  $("map").setAttribute(
    "viewBox",
    `${(850 - w) / 2} ${(610 - h) / 2} ${w} ${h}`,
  );
}
function render() {
  unmodified = simulate(params);
  result = compute();
  for (const k of Object.keys(DEFAULTS)) {
    $(k).value = params[k];
    $(k + "Value").textContent =
      params[k] + (k === "rain" ? " mm" : k === "duration" ? " h" : "%");
  }
  const c = result.cells.find((c) => c.id === selected);
  $("cellName").textContent = name(selected);
  $("siteCode").textContent = "S" + String(selected + 1).padStart(2, "0");
  $("cellIndex").textContent = c.index;
  $("priority").textContent = scoreName(c.level);
  const color = { low: "#58b8a8", medium: "#e7bc75", high: "#ed8d7b" }[c.level];
  $("scoreRing").style.borderColor = color;
  $("priority").style.color = color;
  $("reasons").innerHTML = [
    choose(
      `${Math.round(c.impervious * 100)}% of this site is impermeable.`,
      `${Math.round(c.impervious * 100)}% участка не пропускает воду.`,
    ),
    choose(
      `${fmt(c.incoming)} m³ arrives from upstream sites.`,
      `${fmt(c.incoming)} м³ приходит с верхних участков.`,
    ),
    choose(
      `Drainage removes ${fmt(c.drained)} m³ during this event.`,
      `Дренаж отводит ${fmt(c.drained)} м³ за событие.`,
    ),
  ]
    .map((x) => `<li>${x}</li>`)
    .join("");
  $("cellData").innerHTML = [
    [choose("Synthetic elevation", "Условная высота"), c.elevation + " m"],
    [choose("Storage capacity", "Ёмкость удержания"), c.storage + " mm"],
    [choose("Retained layer", "Слой накопления"), c.layer.toFixed(1) + " mm"],
    [
      choose("Overflow / transit", "Избыток / транзит"),
      fmt(c.overflow) + " m³",
    ],
  ]
    .map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`)
    .join("");
  $("intervene").disabled = interventions.has(selected);
  $("intervene").textContent = interventions.has(selected)
    ? choose("Intervention applied ✓", "Очистка применена ✓")
    : lang === "ru"
      ? ru.intervene
      : english.intervene;
  $("undo").hidden = !interventions.has(selected);
  $("highCount").textContent = result.highCount;
  const delta = result.highCount - baseline.highCount;
  $("highDelta").textContent = choose(
    `${delta > 0 ? "+" : ""}${delta} sites vs. comparison baseline`,
    `${delta > 0 ? "+" : ""}${delta} участков относительно сравнения`,
  );
  $("retained").textContent = fmt(result.totals.retained);
  $("reportCount").textContent = reports.filter(
    (r) => r.status === "confirmed",
  ).length;
  $("pendingLabel").textContent =
    reports.filter((r) => r.status === "draft").length +
    " " +
    choose("pending", "ожидают");
  $("balance").textContent =
    Math.abs(result.totals.balanceError) < 1e-6
      ? choose("Conserved", "Сходится")
      : choose("Mismatch", "Ошибка");
  $("balanceDetail").textContent = choose(
    `${fmt(result.totals.input)} m³ input · ${Math.abs(result.totals.balanceError).toFixed(6)} m³ residual`,
    `${fmt(result.totals.input)} м³ осадков · ${Math.abs(result.totals.balanceError).toFixed(6)} м³ невязка`,
  );
  $("bars").innerHTML = result.cells
    .map(
      (c) =>
        `<i style="height:${Math.max(3, c.index / 4)}px;background:${c.level === "high" ? "#d88b78" : c.level === "medium" ? "#d0b174" : "#5a9d8c"}"></i>`,
    )
    .join("");
  const blocked = new Set(
    reports
      .filter((r) => r.status === "confirmed" && r.type === "blocked_drain")
      .map((r) => r.cellId),
  );
  const ranked = prioritize(result, reports).slice(0, 3);
  $("rankList").innerHTML = ranked
    .map(
      (c, i) =>
        `<button class="rank-button" data-cell="${c.id}"><span class="rank-number">0${i + 1}</span><span class="rank-info">${esc(name(c.id))}<small>${blocked.has(c.id) ? choose("✓ Confirmed blocked drain", "✓ Подтверждён засор") : scoreName(c.level)}</small></span><span class="rank-score">${c.index}</span><span>↗</span></button>`,
    )
    .join("");
  $("comparison").hidden = !interventions.size;
  if (interventions.size) {
    const id = interventions.has(selected)
        ? selected
        : [...interventions].at(-1),
      before = unmodified.cells.find((c) => c.id === id),
      after = result.cells.find((c) => c.id === id);
    $("interventionName").textContent =
      name(id) +
      choose(
        " · local capacity restored",
        " · локальная мощность восстановлена",
      );
    $("beforeScore").textContent = before.index;
    $("afterScore").textContent = after.index;
    const change =
      result.totals.retained +
      result.totals.outflow -
      unmodified.totals.retained -
      unmodified.totals.outflow;
    $("volumeChange").textContent =
      (change > 0 ? "+" : "") + fmt(change) + " m³";
  }
  drawMap();
  renderReports();
  if (tourStep >= 0) tourRender();
}
function reportPersist() {
  try {
    localStorage.setItem("floodshield-reports-v2", JSON.stringify(reports));
  } catch {}
}
function renderReports() {
  $("reportList").replaceChildren();
  for (const r of [...reports].reverse()) {
    const card = document.createElement("article");
    card.className = "report-card";
    const h = document.createElement("div");
    h.className = "report-card-head";
    const title = document.createElement("strong");
    title.textContent = name(r.cellId) + " · " + typeName(r.type);
    const state = document.createElement("span");
    state.className = "tag";
    state.textContent =
      r.status === "confirmed"
        ? choose("CONFIRMED", "ПОДТВЕРЖДЕНО")
        : r.status === "rejected"
          ? choose("REJECTED", "ОТКЛОНЕНО")
          : choose("DRAFT", "ЧЕРНОВИК");
    h.append(title, state);
    const q = document.createElement("blockquote");
    q.textContent = r.quote;
    const source = document.createElement("small");
    source.textContent =
      (r.origin === "meta"
        ? "Meta extraction"
        : r.origin === "example"
          ? "EXAMPLE · manually prepared"
          : "MANUAL ENTRY") +
      " · " +
      new Date(r.createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-GB");
    card.append(h, q, source);
    if (r.status === "draft") {
      const actions = document.createElement("p");
      for (const [status, label] of [
        ["confirmed", choose("Confirm observation", "Подтвердить")],
        ["rejected", choose("Reject", "Отклонить")],
      ]) {
        const b = document.createElement("button");
        b.className =
          "btn " + (status === "confirmed" ? "primary" : "secondary");
        b.textContent = label;
        b.onclick = () => {
          r.status = status;
          reportPersist();
          render();
        };
        actions.append(b);
      }
      card.append(actions);
    }
    $("reportList").append(card);
  }
}
function addReport({ cellId, type, quote, origin }) {
  if (reports.length >= 50) {
    $("aiStatus").textContent = choose(
      "Maximum 50 reports in this local demo.",
      "В локальном демо максимум 50 сообщений.",
    );
    return;
  }
  if (
    reports.some(
      (r) =>
        r.cellId === cellId &&
        r.type === type &&
        r.quote === quote &&
        r.status !== "rejected",
    )
  ) {
    $("aiStatus").textContent = choose(
      "This report is already in the review list.",
      "Это сообщение уже добавлено.",
    );
    return;
  }
  reports.push({
    id:
      globalThis.crypto?.randomUUID?.() ||
      `report-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    cellId,
    type,
    quote,
    origin,
    status: "draft",
    createdAt: new Date().toISOString(),
  });
  reportPersist();
  render();
}
function save() {
  try {
    localStorage.setItem(
      "floodshield-scenario-v2",
      JSON.stringify({ parameters: params, interventions: [...interventions] }),
    );
    $("saveStatus").textContent = choose(
      "Scenario saved on this device.",
      "Сценарий сохранён на устройстве.",
    );
  } catch {
    $("saveStatus").textContent = choose(
      "Storage unavailable. Export a JSON pack.",
      "Хранилище недоступно. Скачайте JSON.",
    );
  }
}
function restore() {
  try {
    const raw = localStorage.getItem("floodshield-scenario-v2");
    if (!raw) {
      $("saveStatus").textContent = choose(
        "No saved scenario yet.",
        "Сохранённого сценария ещё нет.",
      );
      return;
    }
    const data = JSON.parse(raw);
    params = simulate(data.parameters).parameters;
    interventions = new Set(
      Array.isArray(data.interventions)
        ? data.interventions.filter(
            (id) => Number.isInteger(id) && id >= 0 && id < 18,
          )
        : [],
    );
    $("preset").value = "custom";
    render();
    $("saveStatus").textContent = choose(
      "Saved scenario restored.",
      "Сценарий восстановлен.",
    );
  } catch {
    $("saveStatus").textContent = choose(
      "Saved data is invalid. Reset or export a new pack.",
      "Ошибка сохранённых данных. Сбросьте сценарий.",
    );
  }
}
function translate() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll("[data-i18n]"))
    el.innerHTML = (lang === "ru" ? ru : english)[el.dataset.i18n];
  $("language").textContent = lang === "en" ? "RU" : "EN";
  $("labTab").textContent = choose("Scenario lab", "Лаборатория");
  $("historyTab").textContent = choose(
    "Historical evidence ↗",
    "Исторические данные ↗",
  );
  const labels =
    lang === "ru"
      ? [
          "Умеренный дождь",
          "Сильный ливень",
          "Ограниченный дренаж",
          "Насыщенный грунт",
          "Без осадков",
          "Свой сценарий",
        ]
      : [
          "Moderate rain",
          "Intense storm",
          "Drainage stress test",
          "Saturated ground",
          "No rainfall",
          "Custom scenario",
        ];
  [...$("preset").options].forEach((o, i) => (o.textContent = labels[i]));
  const old = $("reportCell").value;
  $("reportCell").innerHTML = CELLS.map(
    (c) => `<option value="${c.id}">${esc(name(c.id))}</option>`,
  ).join("");
  $("reportCell").value = old || "2";
  [...$("reportType").options].forEach(
    (o) => (o.textContent = typeName(o.value)),
  );
  apiLabel();
  render();
  if (tourStep >= 0) tourRender();
  if (historyData) drawHistory();
}
function apiLabel() {
  $("apiStatus").textContent = configured
    ? choose("● META CONFIGURED", "● META НАСТРОЕН")
    : choose("● META KEY NEEDED", "● НУЖЕН КЛЮЧ META");
  $("apiStatus").classList.toggle("ready", configured);
  $("aiStatus").textContent = configured
    ? choose(
        "Your note will be sent to Meta when you click Analyze.",
        "При нажатии сообщение будет отправлено в Meta.",
      )
    : choose(
        "Live Meta extraction needs a server API key. Manual review and the guided demo work now.",
        "Для Meta нужен серверный API-ключ. Ручная проверка и демо уже работают.",
      );
}
async function analyze() {
  const text = $("reportText").value.trim();
  if (!text) {
    $("aiStatus").textContent = choose(
      "Add a field note first.",
      "Введите сообщение.",
    );
    return;
  }
  $("analyze").disabled = true;
  $("aiStatus").textContent = choose(
    "Meta is extracting source-linked observations…",
    "Meta извлекает наблюдения с цитатами…",
  );
  try {
    const r = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(35000),
    });
    const data = await r.json();
    if (!r.ok) {
      $("aiStatus").textContent =
        r.status === 503
          ? choose(
              "Meta is not configured. Open manual review below; no AI result has been generated.",
              "Meta не настроен. Используйте ручную проверку ниже; AI-ответ не создавался.",
            )
          : choose(
              "The response could not be validated. Use manual review or retry.",
              "Ответ не прошёл проверку. Используйте ручной ввод или повторите.",
            );
      $("manual").open = true;
      return;
    }
    if (!Array.isArray(data.observations) || data.provider !== "meta")
      throw Error("invalid");
    for (const o of data.observations) {
      if (
        !Number.isInteger(o.cellId) ||
        o.cellId < 0 ||
        o.cellId > 17 ||
        !typeName(o.type) ||
        typeof o.quote !== "string" ||
        !text.includes(o.quote)
      )
        throw Error("invalid");
      addReport({ ...o, origin: "meta" });
    }
    $("aiStatus").textContent =
      choose(
        `${data.observations.length} drafts extracted. Check the location, meaning and quote before confirming.`,
        `${data.observations.length} черновиков. Проверьте место, смысл и цитату до подтверждения.`,
      ) + (Array.isArray(data.questions) ? " " + data.questions.join(" ") : "");
  } catch {
    $("aiStatus").textContent = choose(
      "Meta is unavailable or returned invalid data. Manual review remains available.",
      "Meta недоступен или вернул некорректные данные. Доступна ручная проверка.",
    );
    $("manual").open = true;
  } finally {
    $("analyze").disabled = false;
  }
}
function tourRender() {
  const steps =
    lang === "ru"
      ? [
          [
            "Начните с ограниченного дренажа",
            "Задайте 45 мм за 6 часов при мощности сети 25%. На схеме меняются сток и приоритеты. Все параметры условные.",
          ],
          [
            "Проверьте сообщение очевидца",
            "Добавлен подготовленный пример о засоре у моста. Подтвердите его вручную: это пример, а не ответ модели Meta.",
          ],
          [
            "Проверьте действие на том же ливне",
            "Восстановлена локальная мощность дренажа. Сравнение показывает расчётный эффект на том же наборе условий.",
          ],
        ]
      : [
          [
            "Start with a stressed drainage network",
            "45 mm over 6 hours, with the network at 25% of its design capacity, changes inspection priorities. The catchment and parameters are synthetic.",
          ],
          [
            "Review a field observation",
            "A manually prepared example reports a blocked drain at Upper Street. Confirm it in the report list. This is not a Meta-generated response.",
          ],
          [
            "Test an action in the same storm",
            "Local drainage capacity is restored. The counterfactual compares the same rainfall before and after the intervention.",
          ],
        ];
  $("tourNumber").textContent = "0" + (tourStep + 1);
  $("tourTitle").textContent = steps[tourStep][0];
  $("tourDescription").textContent = steps[tourStep][1];
  $("tourExit").textContent = choose("Exit", "Выйти");
  $("tourNext").disabled =
    tourStep === 1 &&
    !reports.some(
      (r) =>
        r.cellId === 2 &&
        r.type === "blocked_drain" &&
        r.status === "confirmed",
    );
  $("tourNext").textContent =
    tourStep === 2
      ? choose("Finish ✓", "Завершить ✓")
      : choose("Next →", "Дальше →");
}
function sample() {
  const text = choose(
    "At the Upper Street site, leaves and litter are blocking the drain inlet. Water is collecting next to the crossing. Observed during today’s rain; no measurement of depth.",
    "На участке Верхняя улица листья и мусор перекрывают вход в дренаж. Рядом с переходом скапливается вода. Наблюдение во время дождя; глубина не измерялась.",
  );
  $("reportText").value = text;
  $("reportCell").value = "2";
  $("reportType").value = "blocked_drain";
  return text;
}
function advanceTour() {
  if (tourStep === 2) {
    tourStep = -1;
    $("tour").hidden = true;
    return;
  }
  tourStep++;
  if (tourStep === 0) {
    params = { ...presetValues.stress };
    interventions.clear();
    $("preset").value = "stress";
    selected = 2;
    setView("lab");
  }
  if (tourStep === 1) {
    addReport({
      cellId: 2,
      type: "blocked_drain",
      quote: sample(),
      origin: "example",
    });
    $("manual").open = true;
  }
  if (tourStep === 2) {
    interventions.add(2);
    selected = 2;
  }
  render();
  tourRender();
}
function method(readiness = false) {
  $("methodContent").innerHTML = choose(
    readiness
      ? `<h3>What judges can verify now</h3><p>The scenario solver, conserved water balance, reviewed field reports, drainage counterfactual and downloadable evidence pack work without an API key. The historical layer contains real CEMS post-event geometry with attribution.</p><h3>Meta’s role</h3><p>The server adapter calls Muse Spark through Meta Model API to extract source-linked observations. Strict schema and exact-quote checks plus human review protect the worklist. A live key is required; offline examples are labeled and never presented as model output.</p><h3>Before submission</h3><p>Connect a server-side MODEL_API_KEY, evaluate extraction on held-out notes, and check the participant rules and demo access. This prototype has not demonstrated predictive skill or avoided damage.</p>`
      : `<h3>What the solver does</h3><p>Each synthetic site receives rainfall. Local infiltration is limited by soil, impermeable surface, saturation and duration. Drainage removes water, local storage retains it, and excess travels to a strictly lower adjacent site. The water balance is checked numerically.</p><h3>Priority, not probability</h3><p>The score combines storage-capacity utilisation (up to 60 points) and overflow equivalent (up to 40 points, capped at 80 mm). The thresholds are exploratory: low &lt;35, watch 35–69, inspect first ≥70. They are not calibrated to observed flooding.</p><h3>Counterfactual</h3><p>Drain clearance restores the selected site to 100% of its synthetic design capacity. Rainfall, soil and all other sites are held fixed. This is a hypothetical comparison, not measured maintenance benefit.</p><h3>Limits and evidence</h3><p>No river backwater, snowmelt, flat-surface spreading, groundwater or dynamic hydraulics are modeled. Infiltration applies to local rainfall only. Field reports enter a reviewed worklist; they do not silently change the solver. CEMS flood traces are historical post-event evidence and are not validation of this synthetic model.</p>`,
    readiness
      ? `<h3>Что уже можно проверить</h3><p>Расчёт сценария, баланс воды, проверка сообщений, сравнение очистки дренажа и экспорт работают без ключа. Исторический слой содержит реальные данные CEMS с атрибуцией.</p><h3>Роль Meta</h3><p>Серверный адаптер вызывает Muse Spark для извлечения наблюдений с цитатами. Проверяются схема и точность цитаты, затем человек проверяет смысл. Нужен серверный MODEL_API_KEY. Подготовленные примеры явно отмечены.</p><h3>До сдачи</h3><p>Подключить ключ, проверить извлечение на отложенных сообщениях и сверить правила участника. Точность прогноза и предотвращённый ущерб пока не доказаны.</p>`
      : `<h3>Расчёт</h3><p>Осадки поступают на каждый условный участок. Из локального дождя вычитается впитывание с учётом грунта, проницаемости и насыщения, затем дренаж. Остаток удерживается в условной ёмкости; избыток передаётся самому низкому соседу. Проверяется водный баланс.</p><h3>Индекс, не вероятность</h3><p>Заполнение ёмкости даёт до 60 баллов, избыток — до 40 (80 мм эквивалентного слоя). Низкий &lt;35, средний 35–69, высокий ≥70. Пороговые значения не калиброваны по реальным затоплениям.</p><h3>Сравнение действий</h3><p>Очистка восстанавливает дренаж выбранного участка до 100% условной проектной мощности. Дождь и остальные участки неизменны. Это гипотеза, а не измеренная польза ремонта.</p><h3>Ограничения</h3><p>Не моделируются подпор реки, снеготаяние, растекание по плоской поверхности, подземные воды и динамическая гидравлика. Впитывание действует только на локальный дождь. Сообщения меняют очередь, но не параметры расчёта. Исторические следы CEMS не подтверждают качество условной модели.</p>`,
  );
  $("method").showModal();
}
function setView(view) {
  activeView = view;
  $("labView").hidden = view !== "lab";
  $("historyView").hidden = view !== "history";
  $("labTab").classList.toggle("active", view === "lab");
  $("historyTab").classList.toggle("active", view === "history");
  if (view === "history") loadHistory();
}
async function loadHistory() {
  if (historyData) {
    drawHistory();
    return;
  }
  $("historyStatus").textContent = choose(
    "Loading attributed historical data…",
    "Загрузка исторических данных…",
  );
  try {
    const r = await fetch("data/valencia.json");
    if (!r.ok) throw Error("data");
    historyData = await r.json();
    $("historyFeature").innerHTML =
      '<option value="">All mapped evidence</option>' +
      historyData.features
        .filter((f) => f.properties.layer !== "aoi")
        .map(
          (f) =>
            `<option value="${esc(f.id)}">${esc(f.properties.layer + " · " + f.id)}</option>`,
        )
        .join("");
    drawHistory();
  } catch {
    $("historyStatus").textContent = choose(
      "Historical data could not be loaded. Open the official source above.",
      "Исторические данные недоступны. Откройте официальный источник.",
    );
  }
}
function drawHistory() {
  const j = historyData,
    features = j.features.filter((f) => f.properties.layer !== "aoi"),
    pts = [];
  function walk(coords) {
    if (typeof coords[0] === "number") pts.push(coords);
    else coords.forEach(walk);
  }
  const focused = features.find((f) => f.id === historyFocusId);
  (focused ? [focused] : features).forEach((f) => walk(f.geometry.coordinates));
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]),
    minx = Math.min(...xs),
    maxx = Math.max(...xs),
    miny = Math.min(...ys),
    maxy = Math.max(...ys),
    mid = (miny + maxy) / 2,
    cos = Math.cos((mid * Math.PI) / 180),
    width = Math.max(0.002, (maxx - minx) * cos),
    height = Math.max(0.002, maxy - miny),
    scale = Math.min(850 / width, 390 / height),
    proj = (p) => [
      50 + (p[0] - minx) * cos * scale + (900 - width * scale) / 2,
      490 - (p[1] - miny) * scale - (440 - height * scale) / 2,
    ];
  function path(cs) {
    return cs
      .map((p, i) => {
        const [x, y] = proj(p);
        return (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
      })
      .join(" ");
  }
  let svg =
    '<defs><pattern id="histGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" stroke="#203946" fill="none"/></pattern></defs><rect width="1000" height="540" fill="#10232e"/><rect width="1000" height="540" fill="url(#histGrid)"/>';
  for (const f of features) {
    const layer = f.properties.layer,
      g = f.geometry;
    if (g.type === "Polygon") {
      svg += `<path data-feature="${esc(f.id)}" d="${g.coordinates.map((r) => path(r) + "Z").join(" ")}" fill="#58d3cc60" fill-rule="evenodd" stroke="#62d4cd" stroke-width=".8"><title>${esc(layer + ": " + (f.properties.notation || "Flood trace"))}</title></path>`;
    } else if (g.type === "LineString") {
      svg += `<path data-feature="${esc(f.id)}" d="${path(g.coordinates)}" fill="none" stroke="#dbac76" stroke-width="2"><title>${esc(layer + ": " + (f.properties.damage_gra || "Source assessment"))}</title></path>`;
    } else if (g.type === "Point") {
      const [x, y] = proj(g.coordinates);
      svg += `<circle data-feature="${esc(f.id)}" cx="${x}" cy="${y}" r="3.5" fill="#e68f7b" stroke="#ffcfb9" stroke-width=".5"><title>${esc(f.properties.damage_gra || "Possibly damaged building")}</title></circle>`;
    }
  }
  svg +=
    '<text x="30" y="30" font-size="12" letter-spacing="2" fill="#799aa7">VALENCIA SUD · AOI30 · CRS84</text><text x="30" y="512" font-size="10" fill="#7494a3">' +
    choose(
      "Flood traces · teal / Transport · amber / Buildings · coral. No basemap.",
      "Следы · бирюзовый / Транспорт · охра / Здания · коралловый. Без фоновой карты.",
    ) +
    "</text>";
  $("historyMap").innerHTML = svg;
  $("historyStatus").textContent =
    (focused
      ? focused.id +
        " · " +
        (focused.properties.damage_gra ||
          focused.properties.notation ||
          focused.properties.layer) +
        " · "
      : "") +
    choose(
      "37 mapped flood traces · observed 17 Nov 2024 · not the full flood footprint",
      "37 следов затопления · наблюдение 17 ноября 2024 · не полная площадь наводнения",
    );
  const m = j.metadata;
  $("historyFacts").innerHTML = [
    [
      choose("SOURCE & METHOD", "ИСТОЧНИК И МЕТОД"),
      choose(
        "CEMS photo-interpretation of aerial imagery, 0.2 m. Geometry and original attributes preserved.",
        "Визуальная интерпретация CEMS аэрофотосъёмки 0,2 м. Исходные геометрии и атрибуты сохранены.",
      ),
    ],
    [
      choose("TIME & UNCERTAINTY", "ДАТЫ И НЕОПРЕДЕЛЁННОСТЬ"),
      choose(
        "Event: 29 Oct 2024. Observation: 17 Nov. Release: 27 Nov. “Possibly damaged” is not confirmed damage.",
        "Событие: 29 октября 2024. Наблюдение: 17 ноября. Выпуск: 27 ноября. Возможное повреждение не означает подтверждённое разрушение.",
      ),
    ],
    [
      choose("ATTRIBUTION", "АТРИБУЦИЯ"),
      esc(m.attribution) +
        `<br><a href="${esc(m.license_url)}" target="_blank" rel="noopener">${choose("Data terms ↗", "Условия данных ↗")}</a>`,
    ],
  ]
    .map(([a, b]) => `<div><span>${a}</span><p>${b}</p></div>`)
    .join("");
}
for (const key of Object.keys(DEFAULTS))
  $(key).addEventListener("input", () => {
    params[key] = Number($(key).value);
    $("preset").value = "custom";
    render();
  });
$("preset").onchange = () => {
  if (presetValues[$("preset").value])
    params = { ...presetValues[$("preset").value] };
  render();
};
$("reset").onclick = () => {
  params = { ...DEFAULTS };
  interventions.clear();
  $("preset").value = "base";
  render();
};
for (const id of ["map", "rankList"])
  $(id).onclick = (e) => {
    const el = e.target.closest("[data-cell]");
    if (el) {
      selected = Number(el.dataset.cell);
      render();
    }
  };
$("map").onkeydown = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const el = e.target.closest("[data-cell]");
    if (el) {
      e.preventDefault();
      selected = Number(el.dataset.cell);
      render();
      document.querySelector(`#map [data-cell="${selected}"]`)?.focus();
    }
  }
};
for (const id of ["flow", "labels"]) $(id).onchange = drawMap;
$("zoomIn").onclick = () => {
  zoom = Math.min(1.8, zoom + 0.2);
  drawMap();
};
$("zoomOut").onclick = () => {
  zoom = Math.max(1, zoom - 0.2);
  drawMap();
};
$("zoomReset").onclick = () => {
  zoom = 1;
  drawMap();
};
$("baseline").onclick = () => {
  baseline = compute();
  render();
  $("saveStatus").textContent = choose(
    "Comparison baseline updated.",
    "База сравнения обновлена.",
  );
};
$("intervene").onclick = () => {
  interventions.add(selected);
  render();
};
$("undo").onclick = () => {
  interventions.delete(selected);
  render();
};
$("save").onclick = save;
$("restore").onclick = restore;
$("language").onclick = () => {
  lang = lang === "en" ? "ru" : "en";
  translate();
};
$("sample").onclick = () => {
  const q = sample();
  addReport({ cellId: 2, type: "blocked_drain", quote: q, origin: "example" });
};
$("addManual").onclick = () => {
  const quote = $("reportText").value.trim();
  if (!quote) {
    $("aiStatus").textContent = choose(
      "Add a field note.",
      "Введите сообщение.",
    );
    return;
  }
  addReport({
    cellId: Number($("reportCell").value),
    type: $("reportType").value,
    quote,
    origin: "manual",
  });
};
$("analyze").onclick = analyze;
$("demo").onclick = () => {
  tourStep = -1;
  $("tour").hidden = false;
  advanceTour();
};
$("tourNext").onclick = advanceTour;
$("tourExit").onclick = () => {
  tourStep = -1;
  $("tour").hidden = true;
};
$("about").onclick = () => method();
$("readiness").onclick = () => method(true);
for (const id of ["closeMethod", "closeMethodBottom"])
  $(id).onclick = () => $("method").close();
$("labTab").onclick = () => setView("lab");
$("historyTab").onclick = () => setView("history");
$("export").onclick = () => {
  const data = {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    model: result,
    baseline: {
      parameters: baseline.parameters,
      highCount: baseline.highCount,
    },
    interventions: [...interventions],
    counterfactualWithoutInterventions: unmodified,
    reports,
    historicalSource: historyData?.metadata || null,
    limitations: [
      "Synthetic solver; not calibrated flood probability",
      "Reports manually reviewed; no automatic physical parameter updates",
      "Historical traces are post-event evidence, not a validation set",
    ],
    metaConfigured: configured,
  };
  const u = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = u;
  a.download = "floodshield-evidence.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
try {
  const saved = JSON.parse(
    localStorage.getItem("floodshield-reports-v2") || "[]",
  );
  reports = Array.isArray(saved)
    ? saved
        .filter(
          (r) =>
            r &&
            Number.isInteger(r.cellId) &&
            r.cellId >= 0 &&
            r.cellId < 18 &&
            typeName(r.type) &&
            typeof r.quote === "string" &&
            r.quote.length <= 6000 &&
            ["draft", "confirmed", "rejected"].includes(r.status),
        )
        .slice(0, 50)
    : [];
} catch {}
translate();
fetch("/api/status")
  .then((r) => (r.ok ? r.json() : { configured: false }))
  .then((data) => {
    configured = data.configured === true;
    apiLabel();
  })
  .catch(() => apiLabel());

$("historyFeature").onchange = () => {
  historyFocusId = $("historyFeature").value;
  drawHistory();
};
$("historyOverview").onclick = () => {
  historyFocusId = "";
  $("historyFeature").value = "";
  drawHistory();
};
$("historyMap").onclick = (e) => {
  const f = e.target.closest("[data-feature]");
  if (f) {
    historyFocusId = f.dataset.feature;
    $("historyFeature").value = historyFocusId;
    drawHistory();
  }
};
