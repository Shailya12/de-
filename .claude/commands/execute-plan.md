# Skill: executing-plans

You are using the **superpowers:executing-plans** skill.

Announce: "I'm using the executing-plans skill to implement this plan."

## Startup
1. Read the plan file completely
2. Raise any concerns before starting
3. Create a TodoWrite tracker with all tasks

## Per-Task Loop
For each task:
1. Mark task in-progress in TodoWrite
2. Follow steps precisely — no improvisation
3. Run specified verification command
4. Mark complete only after verification passes
5. Commit with message matching task name

## Stop Immediately If
- A dependency is missing
- Tests fail and you don't know why
- Instructions are unclear or contradictory
- Verification fails 2x in a row

Ask for help. Never force through blockers.

## Completion
After all tasks pass verification:
1. Run full build: `npm run build`
2. Announce: "All tasks complete. Invoking finishing-a-development-branch skill."
