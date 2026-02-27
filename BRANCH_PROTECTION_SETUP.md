# Branch Protection Setup

Some rules **cannot** be enforced through files in the repository — they must be
configured directly in GitHub's repository settings. This document tells you exactly
what to set up and where to find it.

---

## How to get there

Go to your repository on GitHub →  
**Settings** → **Branches** → **Add branch ruleset** (or "Add classic branch protection rule")

> GitHub now recommends **Rulesets** over classic branch protection rules.  
> The settings below apply to both, but the UI differs slightly. Rulesets are more
> powerful and the preferred approach for new projects.

---

## Rules to configure for `main`

### 1. Block direct pushes to `main`

| Setting | Value |
|---|---|
| **Restrict pushes that create matching refs** | ✅ Enabled |
| **Require a pull request before merging** | ✅ Enabled |

This forces all changes to go through a pull request. Nobody — not even admins —
should push directly to `main`.

---

### 2. Require at least 2 approving reviews before merging

| Setting | Value |
|---|---|
| **Required approvals** | `2` |
| **Dismiss stale reviews when new commits are pushed** | ✅ Enabled (recommended) |
| **Require review from Code Owners** | ✅ Enabled — triggers the CODEOWNERS file |

Dismissing stale reviews means that if someone pushes a new commit after receiving
approval, the approval is invalidated and fresh reviews are needed. This prevents
approved-but-then-changed code from slipping through.

---

### 3. Require status checks to pass before merging

Enable the following **required status checks** (these match the job names in
`.github/workflows/ci.yml`). GitHub will only show checks that have run at least
once, so you may need to trigger the CI workflow once first.

| Check name | Purpose |
|---|---|
| `Lint` | ESLint must pass |
| `Test` | All Jest tests must pass

| Setting | Value |
|---|---|
| **Require branches to be up to date before merging** | ✅ Enabled |

"Up to date" means the branch must include all commits from `main` before it can
be merged. This prevents a situation where two PRs individually pass tests but
conflict when merged together.

---

### 4. Require conversation resolution before merging

| Setting | Value |
|---|---|
| **Require conversation resolution before merging** | ✅ Enabled |

Any review comment thread must be marked as resolved before the PR can be merged.
This ensures feedback is not accidentally ignored.

---

### 5. (Optional) Require signed commits

| Setting | Value |
|---|---|
| **Require signed commits** | Consider enabling for extra auditability |

---

## Summary checklist

- [ ] Direct pushes to `main` are blocked
- [ ] PRs require at least 2 approvals
- [ ] Stale reviews are dismissed on new commits
- [ ] CODEOWNERS reviews are required
- [ ] Status checks `Lint` and `Test` are required
- [ ] Branch must be up to date before merging
- [ ] All conversations must be resolved before merging

---

## Note on the Coverage check

The coverage workflow (`.github/workflows/coverage.yml`) is intentionally **not**
listed as a required status check. It posts an informational comment on the PR but
does not block merging. If you later want to enforce a minimum coverage threshold,
add a `--coverageThreshold` option in your Jest config and add the coverage job
as a required check here.