# FloodShield · Field Lab

**From flood signals to field action.** FloodShield helps an operator explore surface runoff, review field observations and compare a drainage intervention under the same rainfall scenario.

This is an executable research prototype for the Meta Global AI Developer Hackathon. It is not an operational flood forecast or emergency warning system.

## Try the demo in 60 seconds

1. Click **Run the 60-second demo**. A synthetic scenario loads: 45 mm of rain over 6 hours, with the drainage network at 25% of its design capacity.
2. Continue to the example field report. Review its exact text and confirm the blocked-drain observation at **Upper Street**. The worklist updates only after confirmation.
3. Continue to the intervention. Under these specific synthetic assumptions, the selected site's index changes from **70 to 23**, and retained water plus catchment outflow decreases by **270 m³**. These are model outputs, not measured benefits. Changing the assumptions changes the result.
4. Switch to **Historical evidence** to see original post-event Copernicus geometry from Valencia Sud, independently of the synthetic solver.
5. Export the evidence pack to inspect inputs, water balance, interventions, reviewed reports and provenance.

The English interface has a Russian toggle. Core interactions do not need an API key or third-party map tiles. **No model response is fabricated when Meta is unavailable.**

The hosted server now has a Meta runtime secret. Real `muse-spark-1.3` requests through the deployed `/api/analyze` route were verified on 30 October 2026. Click **Try the Meta workflow**, enter a field note and choose **Analyze with Meta** to use the live integration. The prepared guided-tour report remains an offline example. See [live validation](VALIDATION.md).

## Run locally

Node.js **22 or newer**. No npm dependencies are required.

```sh
npm start
# http://localhost:4173
```

Optional live Meta extraction:

```sh
# Set MODEL_API_KEY securely in your environment, then:
npm start
```

On Windows PowerShell, set `$env:MODEL_API_KEY` in your own terminal. Never put a real key in browser code, a screenshot, README, or Git. `.env.example` documents the names; `.env` files are ignored. The server does not automatically load `.env`: export environment variables or use Node's `--env-file` with your own file.

Meta uses `https://api.meta.ai/v1/chat/completions`; the default model is `muse-spark-1.3`, configurable with `META_MODEL`. The provider and model must be available to your participant account. Model extraction requires **Analyze with Meta** and transmits the note to Meta. Do not enter private information into a public demonstration.

## What Meta does

Muse Spark extracts source-linked observations from a field note, identifies which of the 18 known sites is explicitly named, and asks questions when evidence is incomplete. The server checks IDs, observation types, output limits and exact source quotations. A person checks meaning and location before confirmation. **A quotation check does not prove factual truth or prevent all prompt injection.**

- `GET /api/status` returns only `{configured: boolean}`; this is configuration presence, not proof of provider health.
- `POST /api/analyze` accepts `{text: string}` (1–6,000 characters).
- Without a server key: HTTP **503**, with manual review still available.
- Malformed model responses are rejected; provider errors are sanitized; requests have a 30-second deadline.

A manually prepared example is marked **EXAMPLE**. Manually entered observations are marked **MANUAL ENTRY**. Only a successful, validated Meta response is marked **Meta extraction**. Field reports change the worklist, not physical model parameters.

### Live evaluation and bounded use

The adapter requests a documented JSON schema, uses low reasoning effort and caps each response at 4,096 completion tokens. It rejects truncated responses even if their content parses. A successful call returns filtered token usage and elapsed time; the interface shows these in a live response receipt and includes the last successful run in the evidence export. A configured key is never described as a successful model call. A schema or quotation check does not establish semantic correctness.

```sh
# Requires a server-side key already set in your environment.
npm run eval:meta -- --live --cases=3
# Full authored regression suite: at most 12 requests, no automatic retries.
npm run eval:meta -- --live --cases=12
```

The authored fixtures cover English, Russian, mixed language, two sites, missing locations, negation and instruction-only input. They check expected site/type pairs, exact quotes (through the adapter), and clarifying questions. They are regression examples, **not an independent or statistically representative benchmark**. The command exits without sending requests unless explicitly opted in and a key is present. Never run live evaluation as an automatic CI job.

The token cap bounds each response, not the account's total spending. Keep reserve credits for judging and check actual token usage and billing before scaling evaluation. Meta's email spending notifications are not a hard spending cap. Live evaluation results, including the initial failure, are recorded in [validation](VALIDATION.md). See [development milestones](docs/DEVELOPMENT.md).

## What is real, and what is synthetic?

| Component | Provenance | Permitted interpretation |
| --- | --- | --- |
| Riverbend geometry, terrain, soil and drains | Synthetic test fixture | Explore a transparent toy event model |
| Rainfall controls | User-selected scenario | Hypothetical conditions, not current weather |
| Drainage intervention | Computed counterfactual | Hypothetical design-capacity restoration |
| Valencia Sud flood traces | Copernicus EMS, EMSR773 AOI30 v1 | Historical post-event traces, not the entire inundation footprint |
| Buildings / transport | Original CEMS assessments | Retain “Possibly damaged” uncertainty; no current passability claim |
| Example field note | Manually prepared demonstration | Review-flow example, not live evidence or Meta output |

See [data documentation](docs/DATA.md) for the original download, observation dates, checksums, attribution and terms. No commercial aerial imagery is redistributed. The historical layer is **not** an independent validation of the synthetic model.

## How the solver works

Each synthetic 1-hectare site receives event rainfall. The model removes locally infiltrated water and drainage, retains water up to an assumed local storage capacity, and passes excess to the lowest strictly lower adjacent site. It accounts for input, infiltration, drainage, retention and catchment outflow.

The 0–100 inspection index combines storage utilisation (up to 60 points) and overflow equivalent (up to 40 points). These weights and thresholds are exploratory, not calibrated probabilities. River backwater, flat-terrain spreading, snowmelt, ice, groundwater and dynamic hydraulics are excluded. Infiltration applies to local rainfall only.

A drain-clearance comparison restores only the selected site's synthetic design capacity; other controls stay fixed. At 100% existing drainage effectiveness, clearance provides no numerical benefit. Reports with confirmed blocked drains are ranked before model scores, using an explicit rule rather than an optimization claim.

## Verify

```sh
npm run check
npm run build
```

Tests cover independent water-accounting cases, routed inflow, invalid geometry and inputs, monotonicity, counterfactual invariants, report prioritization and the Meta adapter with mocked HTTP responses. Built-Worker smoke tests verify the actual deployable artifact separately. A mocked API test is **not** a live Meta evaluation.

## Architecture

- `dist/`: dependency-free browser app, computational modules and attributed GeoJSON.
- `server/meta.js`: Web-standard Meta adapter, validation and API routes.
- `scripts/serve.mjs`: local Node HTTP adapter; no framework required.
- `scripts/build.mjs`: embeds assets and API into a self-contained Cloudflare-compatible ESM Worker (`dist/server/index.js`).
- `tests/`: Node test runner.
- `.github/workflows/ci.yml`: reproducible checks on Node 22.

The tracked `.openai/hosting.json` identifies the existing Sites deployment. It contains no credentials. The build output contains only public assets and server code; keys are provided through runtime secrets. The current Sites deployment is owner-private. A static `dist/` deployment runs the lab and historical view, but cannot provide the live `/api/analyze` route; it explicitly falls back to manual review.

## Hackathon positioning and remaining work

Theme candidate: **Push the Frontier**, by connecting model-assisted interpretation of field evidence with transparent computational scenarios. Judges can inspect the causal comparison, data provenance and code. The public event page emphasizes creativity, technical ambition and a working implementation: https://dev.meta.ai/events/global-hackathon

Before submission: evaluate extraction on independently labeled, held-out reports; verify participant rules and access for judges; obtain domain review; and validate any future prediction on genuinely independent historical events. Live Meta extraction has been exercised against authored fixtures; neither scientific predictive skill nor damage prevention has been demonstrated.

Development assistance: ChatGPT/Codex and bounded research/code-review agents were used. Verify the applicable participant rules for disclosure and permitted assistance. Using a development assistant does not substitute for using Meta in the submitted application.

## License

Source code: MIT, see [LICENSE](LICENSE). Copernicus data retain their own attribution and terms in [docs/DATA.md](docs/DATA.md).
