# Skill: writing-plans

You are using the **superpowers:writing-plans** skill.

Announce: "I'm using the writing-plans skill to create an implementation plan."

## Purpose
Create a comprehensive, executable implementation plan broken into 2–5 minute tasks.

## Plan Structure

### Header
- Goal statement
- Architecture overview
- Tech stack relevant to this feature
- Files to be created/modified

### Tasks
- Use checkbox syntax: `- [ ] Task N: Name`
- Each task = 2–5 minutes of work
- Include **actual code** (no "TBD", no "add validation here", no "similar to above")
- Include exact file paths
- Include exact verification commands

### Self-Review Checklist (run before saving)
- [ ] Every task has real code, not placeholders
- [ ] File paths are consistent across tasks
- [ ] Method/type names are consistent
- [ ] Spec coverage: every requirement maps to a task
- [ ] Verifications are runnable commands

## Output
Save plan to: `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

After saving, ask: "Plan saved. Shall I execute this with subagent-driven-development or inline?"

## Forbidden Language
- "Add appropriate error handling"
- "Similar to Task N"
- "Write tests for the above" (without showing test code)
- "TBD", "TODO", placeholders of any kind
