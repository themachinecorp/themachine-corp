# AGENTS.md - THEMACHINE Corp. Team Rules

## Philosophy
```
→ fluid not rigid       灵活迭代
→ iterative not waterfall 持续交付
→ easy not complex      简单优先
→ built for brownfield  存量优化
→ scalable             可扩展
```

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
└── data/
    └── YYYY-MM-DD.json
```

## Spec-Driven Workflow

### SPEC Directory Structure
```
SPEC/
├── README.md         # Philosophy & usage
├── spec.md           # Current active spec
├── changes/          # Proposed changes
│   └── YYYY-MM-DD-xxx/
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       └── tasks.md
└── archive/          # Completed changes
```

### Workflow Steps
1. **propose** - 提出: `SPEC/changes/YYYY-MM-DD-name/`
2. **spec** - 规格: 定义需求和场景
3. **design** - 设计: 技术方案
4. **implement** - 实施: 代码实现
5. **archive** - 归档: 移至archive/

### Spec CLI
```bash
# 查看当前规格
spec cat

# 列出变更
spec ls

# 创建新变更
spec new <feature-name>

# 归档变更
spec archive <change-name>
```

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
1. Always create SPEC before coding
2. Keep SPEC under 60 lines
3. Signal over noise
4. No "mental notes" - write to files
