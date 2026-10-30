# FloodShield v0.3 validation

Date: 30 October 2026 (Asia/Qyzylorda). Verification scope: executable research demo, not a validated flood forecast.

## Automated checks

40 Node tests pass: 18 solver tests, 6 counterfactual/worklist tests, 13 mocked Meta API tests and 3 built-Worker smoke tests. The artifact is rebuilt from current source during the test suite. Checks cover independent water accounting, conservation, routed inflow, invalid numeric/geometry inputs, downhill acyclicity, input immutability, parameter monotonicity, local intervention behavior at zero and full existing drainage, report confirmation rules, request bounds, source-quote validation, deadlines and sanitized errors. No real Meta call was made because no participant key is configured.

## Browser checks

v0.3 recheck: the new Meta-workflow button focuses the field note; missing-key analysis returns an explicit unavailable state; human confirmation still gates the tour; the stress scenario still yields 70 → 23 and −270 m³. The new workflow explanation translates into Russian. The successful-live-response receipt is implemented but has not been exercised against a real Meta account. No live credits were spent by this session.

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
