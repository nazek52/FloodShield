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

Supply MODEL_API_KEY only through server runtime secrets. Analyze a previously unseen field note, including an ambiguous location and a negated observation. Show what is rejected or sent for review. Until a live key is configured, explicitly present the manual flow and adapter tests; do not claim a live AI demo.

## Do not claim

Predictive accuracy, emergency readiness, current road safety, verified damage, avoided losses, or that historical CEMS geometry validates the synthetic solver. “Possibly damaged” remains uncertain.
