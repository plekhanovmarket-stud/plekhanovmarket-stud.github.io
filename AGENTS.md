# AGENTS.md — Ozon Dashboard frontend

## Scope

These instructions apply to the entire site repository. Read `CLAUDE.md` first.
The calculation source is the linked private repository `plekhanovmarket-stud/ozon-data`.
Do not create a frontend formula when a verified value belongs in the data build.

## Authority and production protection

- Андрей is the only person who marks work as accepted.
- Keep implemented, verified, and accepted separate.
- Work only on the assigned `codex/*` branch.
- Never edit, commit, push, merge, publish, or switch production `main` without explicit authorization for that exact operation.
- Do not use `claude/*` branches, force-push, enable auto-merge, or delete branches.
- Before editing, inspect branch, HEAD, upstream, `git status`, and divergence from `origin/main`.
- Do not work in a checkout used by the production scheduler.
- Never commit secrets, credentials, cookies, account identifiers, or machine-specific paths.

## Data and interface rules

- Do not hand-edit generated files under `data/`.
- Trace each displayed number to its JSON field and the generating function in `ozon-data`.
- Missing, incomplete, failed, and zero must remain distinct.
- Facts, allocated expenses, normative values, and estimates must have visibly different labels.
- Use short Russian labels; keep technical details collapsed.
- Finance must fit desktop without horizontal scrolling at readable sizes and use convenient cards on mobile.
- Finance reads `data/dashboard_v2.json`.
- Preserve the three results: before credit and VAT; after credit reserve before VAT; after credit reserve and VAT.
- A store-level reconciliation must not be presented as verified SKU profit.
- Do not hardcode audit totals, dates, statuses, or control-SKU values.

## Required checks

Before editing:

- confirm clean working tree and expected `codex/*` branch;
- fetch `origin/main` and inspect divergence;
- inspect the JSON producer and every affected page;
- reproduce the current behavior.

After editing:

- test all affected pages against saved data;
- check desktop and mobile layouts;
- inspect browser console and network errors;
- verify unavailable values are not shown as zero;
- inspect the diff for generated data, secrets, local paths, hardcoded audit values, and unrelated refactoring;
- verify navigation and shared assets were not regressed.

A rendered page, HTTP 200, or lack of console errors alone does not prove business correctness.

## Commit and push

Commit only after focused verification and diff review. Push only to the assigned `codex/*` branch.
Do not open, merge, or publish a pull request without Андрей's separate instruction.
