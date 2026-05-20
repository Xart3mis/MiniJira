# Contributing Guidelines

## Quick Start

1. **Clone & install**
   ```bash
   git clone <repo>
   cd minijira
   npm run install-all
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/task-name
   ```

3. **Make changes, commit, push**
   ```bash
   git add .
   git commit -m "feat(component): description"
   git push origin feature/task-name
   ```

4. **Create Pull Request**
   - Link to GitHub Issue
   - Describe changes
   - Request reviewer

---

## Commit Message Format

```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

### Types
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `style` — code style (no logic change)
- `refactor` — code refactoring
- `test` — tests
- `chore` — build/CI/dependencies

### Scope
- `frontend` / `backend` / `infrastructure` / `lambda` / `docs`

### Examples
```
feat(frontend): add kanban drag-and-drop
fix(backend): team isolation check in GET /tasks
docs(setup): add Lambda deployment instructions
chore(backend): update dependencies
```

---

## Branch Naming

```
feature/feature-name
bugfix/bug-description
docs/doc-name
hotfix/critical-issue
```

---

## Pull Request Process

1. **Before pushing**
   - Run linter: `npm run lint` (if set up)
   - Test locally
   - Update docs if needed

2. **Create PR**
   - Title: same as commit subject
   - Description: explain what + why
   - Link issue: "Closes #123"

3. **Code review**
   - Assign reviewer (team member)
   - Address feedback
   - Re-request review after changes

4. **Merge**
   - Require 1 approval
   - Delete branch after merge
   - Close linked issue

---

## Code Style

### JavaScript/Node.js
- Use ES6+ syntax (const, arrow functions, template literals)
- Semicolons required
- 2-space indentation
- No console.log in production code; use logger instead
- Handle errors explicitly

### React
- Functional components + hooks only
- Props validation (PropTypes or TypeScript)
- One component per file (unless very small)
- Use descriptive names

### Database
- Table names: snake_case lowercase (`minijira_tasks`)
- Attribute names: camelCase (`taskId`, `createdAt`)
- Timestamps: ISO 8601 format with .toISOString()

---

## Testing Guidelines

- Test locally before pushing
- For backend: Use Postman or curl to test API endpoints
- For frontend: Manually click through features + browser console check
- Check CloudWatch logs for errors

---

## Communication

### Blockers
- Post in team channel **immediately** (don't wait for standup)
- Include: what you're blocked on, what you need, timeline

### Questions
- Ask in team channel (may help others)
- If answer is long, escalate to video call

### Code Review Feedback
- Be respectful and constructive
- Explain *why* if requesting change
- Approve when satisfied

---

## Before Submitting (Final Checklist)

- [ ] All features work locally
- [ ] No console.log or debug code left
- [ ] Code is readable and well-named
- [ ] Comments added only where non-obvious
- [ ] No sensitive data (keys, passwords) in code
- [ ] Dependencies updated + documented
- [ ] Environment variables documented in .env.example
- [ ] Tests pass (if applicable)
- [ ] PR reviewed + approved

---

## Post-Deployment

After deployment to AWS:
- [ ] Test full demo scenario
- [ ] Check CloudWatch logs for errors
- [ ] Monitor CloudWatch metrics
- [ ] Verify no cost overruns

---

## Questions?

Ask in team channel or mention person directly. We're in this together! 🚀
