# Structured Roofing Pricing Audit

## Defect traced

The prior roofing calculator loaded all active roofing rates and inferred quantity from the rate unit. That meant pitch labour, linear labour, delivery, travel, hotel, project-management and other optional rates were all stacked onto every estimate. Non-measured rates also used a default quantity of `1`, turning optional add-ons into mandatory charges.

## Stabilized model

Roofing now calculates through labelled structures and repeatable **Pitch Areas**:

1. Estimate-level roofing measurements are normalized into one or more structures.
2. Blank or whitespace labels normalize to `Main Structure`; duplicate labels are allowed because the UUID is authoritative.
3. Each Pitch Area stores its own pitch, area, area-entry type and waste override.
4. Actual roof area is used directly; horizontal plan area is multiplied by the pitch multiplier.
5. Only structures marked `Included in Base` contribute to the base customer total.
6. Optional and alternative structures remain priced separately for proposal selection.

## Rate application guardrails

A roofing rate is applied only when it has an explicit rule, a selected system rule, a recognized measurement condition, a matching pitch-area row, a specific penetration/ventilation quantity, or an estimator-reviewed manual selection. Unit strings are never enough to apply a rate.

The live-regression scenario is covered by automated tests:

- 4/12 labour applies only to 20.91 squares.
- 8/12 labour applies only to 4.00 squares.
- 10/12 pitch labour is not applied.
- additional-layer labour is zero for one existing layer.
- additional-storey labour is zero for one storey.
- wall-flashing labour uses 2 LF.
- valley labour uses 36 LF.
- gooseneck labour uses quantity 3.
- plumbing-boot labour uses quantity 1.
- hotel/travel/delivery/project-management style rates are not applied unless explicitly selected or condition-driven.

## Ventilation

Each structure may calculate ventilation from attic floor area, selected ratio, intake/exhaust NFVA, existing capacity and eligible ridge length. Missing NFVA or insufficient ridge/intake/exhaust capacity is reported as a warning rather than silently calculated.
