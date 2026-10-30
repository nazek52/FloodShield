# 60-second walkthrough

**Problem:** a flood signal does not tell a field team which observation needs verification or what a proposed drainage action changes.

**Product:** explore a scenario → review a source-linked report → prioritize an inspection → compare a specific action under the same assumptions.

## Show

- Run the guided demo. Clearly say the catchment is synthetic.
- Show the source quotation and the human confirmation step.
- Show Upper Street's 70 → 23 index and −270 m³ residual-water change. These numbers are computed from the displayed stress scenario and should be labeled hypothetical.
- Change rainfall or undo the intervention to show the result is computed, not a prerecorded animation.
- Open historical evidence: real CEMS geometry and provenance, with no forecast score attached.
- Export JSON to show reproducibility and evidence separation.

## Meta setup

The hosted server has MODEL_API_KEY configured as a secret. Select **Try the Meta workflow**, enter a fresh note, then select **Analyze with Meta**. Show the returned model name, latency and token count, the exact source quotation, and the human confirmation gate. Try an ambiguous location and a negated observation. The guided tour's EXAMPLE report is prepared manually and is separate from the live extraction.

Suggested live note: `Upper Street: leaves cover the drain inlet. Lower Park: water is pooling; I cannot see the drain.` Ask a judge to edit this text before analysis. Do not call the returned drafts verified facts.

The hosted demo currently requires its owner's ChatGPT account. Judge access and a separate-visitor check must be arranged before submission.

## Do not claim

Predictive accuracy, emergency readiness, current road safety, verified damage, avoided losses, or that historical CEMS geometry validates the synthetic solver. “Possibly damaged” remains uncertain.
