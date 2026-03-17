# Contradiction Detection

## Overview
Scans a corpus of papers for conflicting empirical claims, methodological disagreements, or opposing conclusions on the same topic. Surfaces genuine scientific contradictions that the team needs to be aware of — before they cite conflicting work or build on a shaky premise.

## When to Use
- User asks "do any of our papers disagree with each other?"
- User is writing a discussion section and needs to address conflicting findings
- User wants to know if a claim they're making is contested in the literature
- Lab is onboarding to a new area and needs to understand where debates lie
- User asks "why do paper A and paper B get different results on [benchmark]?"

## Key Capabilities
- Extract quantitative claims and conclusions from paper full-text or abstracts
- Compare claims across papers on the same topic, dataset, or research question
- Classify contradictions by type: empirical (different results), methodological (different best practices), interpretive (different explanations for the same data)
- Score contradiction severity: minor discrepancy vs. fundamental disagreement
- Trace contradictions to potential causes: different datasets, evaluation protocols, hyperparameters
- Generate a contradiction report structured by topic cluster

## Usage Examples

### Scan team corpus for contradictions
```python
contradictions = contradiction_detection.scan(
    corpus=review.get_papers(),
    topic="learning rate schedules in transformer training",
    min_confidence=0.7
)
```

### Check if a specific claim is contested
```python
contradiction_detection.check_claim(
    claim="Dropout consistently improves generalization in large language models",
    corpus=review.get_papers(),
    search_external=True
)
```

### Generate contradiction report for discussion section
```python
contradiction_detection.report(
    topic="benchmark evaluation of protein structure prediction",
    format="discussion_section_draft",
    include_resolution_suggestions=True
)
```

## Output Format
Returns list of contradiction pairs with: paper A, paper B, conflicting claims, contradiction type, severity score, and suggested resolution or explanation. Optionally formatted as a discussion section narrative.

## Notes
- Works best on papers with structured results sections and explicit quantitative claims
- Interpretive contradictions are harder to detect automatically — flag for human review
- Combine with `evidence-grading` to assess which side of a contradiction has stronger support
