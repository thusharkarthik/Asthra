# .asthra — AI Agent Memory System

This folder is the shared memory layer for AI coding agents
(Claude Code, Codex, and others) working on Asthra.

## Structure

```
.asthra/
├── platform.json        # Platform identity, architecture rules, agent instructions
├── services/            # Per-service ownership and boundary definitions
│   └── *.json
├── memory/
│   ├── state.md         # Current phase, active branch, what's in progress
│   ├── bugs.md          # Bug registry — open, fixed, deferred
│   └── decisions.md     # Architectural decisions (append-only, never overwrite)
└── sessions/
    └── YYYY-MM-DD.md    # Daily session logs (append, never overwrite)
```

## Rules for AI Agents

1. Always read `platform.json` and `memory/state.md` before starting work.
2. Always update `memory/state.md` and `memory/bugs.md` after finishing.
3. Always append to `sessions/YYYY-MM-DD.md` — never overwrite session logs.
4. Only append to `decisions.md` — never edit existing entries.
5. Only update `platform.json` if explicitly instructed to.
6. Do not touch files listed in `platform.json` `doNotTouch` without
   explicit human instruction.

## Rules for Humans

- Review `memory/state.md` at the start of each session to orient
  new agents quickly.
- When switching between Claude Code and Codex, commit memory
  file changes so both agents see the latest state.
- Add new bugs to `memory/bugs.md` manually if discovered outside
  an agent session.
