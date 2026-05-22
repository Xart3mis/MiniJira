---
name: team-isolation-check
description: Audit a backend controller for correct team isolation enforcement. Args: path to the controller file (relative or absolute).
---

## Team Isolation Audit

Read the controller file specified in the skill args and check every route handler against the rules below. Report PASS or FAIL per handler with the exact line number and a one-line fix for any failure.

### Rules to enforce

1. **teamId extracted from token, not request body/params**
   - `req.user.teamId` must be the source of truth.
   - A handler that reads `teamId` from `req.body` or `req.params` to determine access is a FAIL.

2. **DynamoDB queries filter by teamId at the database level**
   - Queries against the Tasks, Projects, or Comments tables must include a `teamId` condition in the KeyConditionExpression or FilterExpression.
   - Fetching all records and filtering in JavaScript is a FAIL.

3. **Item-level fetches verify ownership after retrieval**
   - After a `GetItem` or `get` call, the handler must assert `item.teamId === req.user.teamId`.
   - Missing this check means an employee can access any resource by guessing its ID — FAIL.

4. **403 on team mismatch, not 404**
   - Returning 404 when teamId mismatches leaks no existence information, but the project spec requires 403 for forbidden access. Either is acceptable; note which is used.

5. **Manager bypass is explicit**
   - If managers are allowed cross-team access, the bypass must be gated on `req.user.role === 'Manager'` — not inferred or absent.
   - No bypass check present when the spec requires one = FAIL.

6. **No hardcoded teamId values**
   - Any string literal used as a teamId in a query is a FAIL.

### Output format

```
Handler: <functionName> (line <N>)
  Rule 1 — teamId source:        PASS
  Rule 2 — DB-level filter:      FAIL  line 42: filter applied in JS after scan; use GSI query with KeyCondition
  Rule 3 — ownership check:      PASS
  Rule 4 — 403 vs 404:           PASS (403)
  Rule 5 — manager bypass:       PASS
  Rule 6 — hardcoded teamId:     PASS

Overall: 1 FAIL — fix line 42 before shipping.
```
