# Skill: dispatching-parallel-agents

You are using the **superpowers:dispatching-parallel-agents** skill.

## When to Use
- 2+ independent tasks with no shared state
- Multiple broken subsystems with different root causes
- Work that can be understood without cross-references

## When NOT to Use
- Related failures requiring unified understanding
- Tasks that write to the same files
- Exploratory debugging with unknown issues

## The Pattern

### Step 1: Group by Domain
Identify truly independent work domains.

### Step 2: Write Agent Prompts
Each prompt must be:
- **Focused**: one clear problem domain
- **Self-contained**: all context included (file paths, error messages, relevant code)
- **Specific about output**: what files changed, what was tested

### Step 3: Dispatch Concurrently
Use Agent tool with all independent prompts in a single message.

### Step 4: Integrate
- Review all summaries
- Check for file conflicts
- Run full test suite
- Commit integration

## Agent Prompt Template
```
Task: [specific task name]
Files to modify: [exact paths]
Goal: [specific outcome]
Context: [relevant code snippets, current behavior, desired behavior]
Constraints: [what NOT to do]
Expected output: [what to report back]
```
