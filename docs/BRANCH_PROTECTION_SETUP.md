# Branch Protection Setup

Some rules cannot be enforced through files in the repository — they must be
configured directly in GitHub's repository settings. This document tells you exactly
what to enable and where to find it.

---

## How to get there

**Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**

---

## Step 1 — Name and target

| Field | Value |
|---|---|
| **Ruleset name** | `Protect main` |
| **Enforcement status** | `Active` |
| **Target branches** → Branch targeting criteria | `Default` |

Leave the **Bypass list** empty — nobody should be able to bypass these rules.

---

## Step 2 — Rules to enable

Work through the Rules section and enable the following. Leave everything not
mentioned here at its default (off).

---

### Restrict deletions
✅ Enable

Prevents the `main` branch from being deleted.

---

### Require a pull request before merging
✅ Enable

This is the main gate — all changes must come through a PR. Once enabled, a set
of sub-options appears. Configure them as follows:

| Sub-option | Value |
|---|---|
| **Required approvals** | `3` |
| **Dismiss stale pull request approvals when new commits are pushed** | ✅ Enabled |
| **Require review from Code Owners** | ✅ Enabled |
| **Require approval of the most recent reviewable push** | ✅ Enabled |
| **Require conversation resolution before merging** | ✅ Enabled |

> **Dismiss stale approvals** means if someone pushes a new commit after receiving
> approval, the approval is invalidated and fresh reviews are needed. This prevents
> approved-but-then-changed code from slipping through.
>
> **Require approval of the most recent reviewable push** means the person who
> pushed the last commit cannot be one of the approvers — someone else must sign off.

---

### Require status checks to pass
✅ Enable

Click **Add checks** and add the following (they appear in the dropdown once CI
has run at least once — push a commit to a branch first if they don't show up):

| Check name |
|---|
| `Lint` |
| `Test` |

Also enable:

| Sub-option | Value |
|---|---|
| **Require branches to be up to date before merging** | ✅ Enabled |

> "Up to date" means the branch must include all commits from `main` before merging.
> This prevents two PRs from individually passing tests but conflicting when merged.

---

### Block force pushes
✅ Enable

Prevents anyone from force pushing to `main`, which would rewrite history.

---

### Allowed merge methods
✅ Enable, then configure:

| Method | Value |
|---|---|
| **Merge commits** | ❌ Disabled |
| **Squash merging** | ✅ Enabled |
| **Rebase merging** | ❌ Disabled |

Only allowing squash merges keeps the `main` history clean — every PR becomes a
single commit with a clear message, regardless of how many commits were in the branch.

---

## Summary checklist

- [ ] Ruleset is set to `Active`
- [ ] Target is set to `Default` branch
- [ ] Bypass list is empty
- [ ] **Restrict deletions** is enabled
- [ ] **Require a pull request before merging** is enabled
  - [ ] Required approvals set to `3`
  - [ ] Dismiss stale approvals enabled
  - [ ] Require review from Code Owners enabled
  - [ ] Require approval of most recent push enabled
  - [ ] Require conversation resolution enabled
- [ ] **Require status checks to pass** is enabled
  - [ ] `Lint` check added
  - [ ] `Test` check added
  - [ ] Require branches to be up to date enabled
- [ ] **Block force pushes** is enabled
- [ ] **Allowed merge methods** — only Squash merging enabled

---

## Note on the Coverage check

The coverage workflow (`.github/workflows/coverage.yml`) is intentionally **not**
listed as a required status check. It posts an informational comment on the PR but
does not block merging. If you later want to enforce a minimum coverage threshold,
add a `--coverageThreshold` option in your Jest config and add the `Coverage` job
as a required check here.