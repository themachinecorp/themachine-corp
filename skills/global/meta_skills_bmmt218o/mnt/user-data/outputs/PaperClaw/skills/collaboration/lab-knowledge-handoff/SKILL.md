# Lab Knowledge Handoff

## Overview
Packages a departing team member's knowledge — their reading history, annotations, notes, and expertise — into a structured handoff document that the lab retains permanently. Prevents institutional knowledge loss when students graduate, postdocs move on, or collaborators leave.

## When to Use
- A lab member is graduating, leaving, or transitioning off a project
- Lab wants to archive what a departing member knew before they go
- New member is onboarding to a project previously owned by someone else
- PI wants to understand what a former student had read and learned
- Lab is archiving a completed project for future reference

## Key Capabilities
- Generate a comprehensive knowledge portrait for a departing team member
- Summarize their most-read topics, key annotations, and unique contributions to the lab's knowledge base
- Package their reading list, notes, and annotations into a portable archive
- Generate an onboarding guide for their successor, framed around what the departing member knew
- Flag papers only they had read (single-reader papers) that need redistribution
- Create a "what I know that isn't written down" interview questionnaire to capture tacit knowledge

## Usage Examples

### Generate handoff package for departing member
```python
handoff = lab_knowledge_handoff.generate(
    member="alice",
    include_reading_history=True,
    include_annotations=True,
    include_unique_papers=True,
    generate_successor_guide=True
)
```

### Identify papers only one member has read
```python
lab_knowledge_handoff.single_reader_papers(
    member="alice",
    importance_filter="high"  # only flag high-citation or team-tagged papers
)
```

### Generate onboarding guide for successor
```python
lab_knowledge_handoff.onboarding_guide(
    predecessor="alice",
    successor="frank",
    project="protein_fitness_prediction",
    format="structured_markdown"
)
```

### Export portable archive
```python
lab_knowledge_handoff.export_archive(
    member="alice",
    format="zip",  # zip | json | pdf
    output_path="./alice_knowledge_archive_2024.zip"
)
```

## Output Format
Handoff package includes: expertise summary, top 50 papers with annotations, unique contributions, open questions left unresolved, and a recommended reading list for their successor. Archive exports as ZIP (JSON + PDFs) or structured PDF.

## Notes
- Run this skill 2–4 weeks before a member departs to allow time for gaps to be addressed
- The "tacit knowledge interview" questionnaire is generated automatically — PI should conduct it in person
- Archives are stored locally — PaperClaw does not retain copies after export
