# AGENTS.md - THEMACHINE Corp. Team Rules

## Agent Coordination

### Communication Pattern
- **THE MACHINE** (CEO) → coordinates all
- cto → research, technical
- cmo → content, social
- cfo → trading, finance
- cpo → product
- sec → security

### File-Based Coordination
```
intel/
├── DAILY-INTEL.md    # Research output (cto writes)
├── data/
│   └── YYYY-MM-DD.json
└── content/
    ├── tweets/       # cmo reads
    └── articles/     # cmo writes
```

### Output Files
Each agent writes to their own directory:
- cto: intel/, code/
- cmo: content/
- cfo: trading/
- cpo: product/

## Memory

### Daily Logs
`memory/YYYY-MM-DD.md` - Raw notes

### Long-term
`MEMORY.md` - Curated insights

### Write It Down!
- Memory is limited. Files survive.
- "Remember this" → update memory
- Lessons learned → update memory

## Quality Standards
1. Always cite sources
2. Signal over noise
3. No "mental notes" - write to files
4. Keep SOUL.md under 60 lines
