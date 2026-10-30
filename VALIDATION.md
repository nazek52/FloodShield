# FloodShield v0.3 validation

Date: 30 October 2026 (Asia/Qyzylorda). Verification scope: executable research demo, not a validated flood forecast.

## Automated checks

40 Node tests pass: 18 solver tests, 6 counterfactual/worklist tests, 13 mocked Meta API tests and 3 built-Worker smoke tests. The artifact is rebuilt from current source during the test suite. Checks cover independent water accounting, conservation, routed inflow, invalid numeric/geometry inputs, downhill acyclicity, input immutability, parameter monotonicity, local intervention behavior at zero and full existing drainage, report confirmation rules, request bounds, source-quote validation, deadlines and sanitized errors. These tests are separate from the real Meta checks below.

## Live Meta checks — 30 October 2026

A dedicated key is stored as a hosted server secret. Authenticated requests to the published `/api/analyze` route exercised the full deployed Worker → Meta → output validation path with `muse-spark-1.3`.

- Initial authored suite: **11/12 passed**. The two-site note returned the expected blocked-drain and surface-water observations plus an unnecessary `unknown` observation for missing drain-condition information.
- Change: clarify that missing information is not a separate physical observation and must not duplicate a concrete observation for the same site.
- Complete follow-up suite: **12/12 passed**, all HTTP 200. It covers English, Russian, mixed language, negation, missing/unknown locations, two sites, instruction-only input and a greeting with no observation.
- Follow-up observed request latency: **6.5–8.6 seconds**. Both runs made 24 real inference requests in total, with no automatic retries.
- Exact source-quotation and schema checks were enforced by the deployed adapter for every successful request. This does not establish factual truth or general semantic accuracy.

The per-case site/type results, latency and prompt revision—including the initial failure—are retained in [the live run record](docs/live-meta-2026-10-30.json). The public record excludes account, billing, credential and internal deployment identifiers. These are authored regression examples, not a held-out or statistically representative benchmark.

## Browser checks

Earlier v0.3 browser recheck: the Meta-workflow button focuses the field note; missing-key analysis returns an explicit unavailable state; human confirmation gates the tour; the stress scenario yields 70 → 23 and −270 m³. The workflow explanation translates into Russian. The latest real Meta checks exercised the published HTTP API and returned receipt fields; the development browser reaches the Site's ChatGPT sign-in gate, so a fresh browser click-through of live extraction in the owner's session remains to be completed. Live credits were used for the checks above.

- Guided step 2 requires human confirmation before step 3 can proceed.
- Stress scenario: 45 mm / 6 h / 60% saturation / 25% network drainage.
- Reviewed Upper Street example enters the worklist only after confirmation.
- Clearance counterfactual: site index 70 → 23; remaining-plus-exported water −270 m³. These are conditional synthetic outputs.
- Save → reset → restore retains the scenario and local intervention.
- Without a Meta key, Analyze returns an explicit unavailable state and offers manual review; no AI output is fabricated.
- No-rainfall scenario: 0 high-priority sites, 0 retained volume.
- Historical mode loads 37 real flood traces and 16 building points; source geometry can be focused and returned to overview.
- English/Russian switching verified on the main page and historical mode.
- Export JSON triggers a download containing both raw and derived records.
- Desktop layouts visually inspected. Responsive CSS is supplied; a separate mobile-device validation has not been completed.

A browser check found crypto.randomUUID unavailable on the HTTP preview origin. Report IDs now use a non-security fallback when that method is unavailable; the guided flow was rerun successfully.

## Evidence limitations

The CEMS historical layer is observational, post-event, separately attributed and not fed into the synthetic solver. The tests do not establish predictive accuracy, causal effectiveness of real maintenance, quality of drinking water, road safety or emergency readiness. Exact quotes do not establish truthful observations; confirmation is still required.
