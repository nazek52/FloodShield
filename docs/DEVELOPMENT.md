# FloodShield v0.3 development and Meta integration

Updated: 30 October 2026, Asia/Qyzylorda.

## Completed in this iteration

- A visible three-step explanation connects field notes, Meta extraction and reviewed drainage comparisons. A direct button focuses the report workflow.
- Successful Meta responses display the requested model, elapsed time and provider-supplied token counts. Configuration alone is labeled separately.
- JSON-schema decoding, a 4,096-completion-token cap, low reasoning effort, and rejection of truncated output prepare the adapter for live use.
- Twelve authored multilingual regression fixtures and an explicit, bounded live evaluation command are included. They have not been run against a real model.
- The existing solver, historical evidence and manual review remain usable. No synthetic report is represented as an AI response.

## Next milestone: real Meta integration

1. Authenticate the correct Meta participant account in a browser accessible to the development session, or configure MODEL_API_KEY directly in the deployment's server-side secrets. Signing in in another browser does not share its session or provide an API key.
2. Verify a single real extraction. Inspect the actual response and usage. A key-presence status is not a connectivity check.
3. Run the three-case live smoke evaluation; correct observed failures before the full twelve-case regression run. Keep failed cases in the report rather than selecting only successes.
4. Collect genuinely new, independently labeled reports. Evaluate site attribution, false blockage inference, negation, uncertainty and quote accuracy. Include unfamiliar place names and adversarial input.
5. Configure and verify spending controls in the provider account before exposing the API to additional visitors. Per-request token limits do not constitute a global budget limit.

## Jury readiness

- Show an unseen report going through the real Meta endpoint; distinguish it from the prepared offline tour.
- Demonstrate the human confirmation gate and the same-storm counterfactual.
- Enable a supported judge-access method and test it using a separate visitor context. The current hosted Site is owner-private; the GitHub repository is public.
- Read the participant's accepted Official Rules, including assistance disclosure and submission requirements. Public event marketing is not the complete ruleset.
- Position the result as a research workflow. The synthetic solver has not been calibrated or independently validated for operational flood forecasting.

## Credit use

Use participant credits for actual inference, error analysis and useful iteration. Start with a small bounded run, inspect billing and latency, then expand only where results justify it. Preserve a reserve for the demonstration and judging. The participant's reported $150 balance has not yet been verified from a signed-in session.
