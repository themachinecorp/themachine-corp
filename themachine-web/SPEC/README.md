# THEMACHINE CORP. - SPEC

> AI-Driven Spec Development

## Philosophy
```
→ fluid not rigid       灵活迭代
→ iterative not waterfall 持续交付
→ easy not complex      简单优先
→ built for brownfield 存量优化
→ scalable             可扩展
```

## Project Structure
```
SPEC/
├── README.md           # This file
├── spec.md             # Current active spec
├── changes/            # Proposed changes
│   └── YYYY-MM-DD-xxx/
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       └── tasks.md
└── archive/            # Completed changes
```

## Workflow
1. **propose** - 提出新功能想法
2. **spec** - 定义规格和需求
3. **design** - 技术设计
4. **implement** - 实施
5. **archive** - 归档

## Commands
```bash
# 查看当前规格
cat SPEC/spec.md

# 查看变更列表
ls SPEC/changes/
```
