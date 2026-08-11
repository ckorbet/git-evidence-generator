## Context

The repository has exactly one commit ("first commit", hash `b548d47`) and has never been pushed to its `origin` remote (`https://github.com/ckorbet/git-evidence-generator.git` — no remote branches exist). That commit accidentally included `app/node_modules` (14,002 files), `app/dist` (78 files, including a built NSIS installer and blockmap), `app/out` (5 files, electron-vite build output), and two TypeScript incremental build caches (`app/tsconfig.node.tsbuildinfo`, `app/tsconfig.web.tsbuildinfo`). Only 73 files under `app/` are legitimate hand-written source/config. This inflates `.git` to ~278MB. There is also no root `README.md` documenting how to run the app (Node 20+, Git on PATH, npm scripts: `dev`, `build`, `start`, `typecheck`, `test`, `lint`, `dist:win`, `dist:mac`), and no root `.gitignore` to prevent this from recurring.

## Goals / Non-Goals

**Goals:**
- Add a comprehensive root `.gitignore` matching standard Node/Electron project conventions.
- Untrack the already-committed bloat so the repository only tracks legitimate source/config going forward.
- Reclaim the wasted `.git` storage by amending the single existing commit in place, since it is safe to do (unpublished — no remote history to conflict with).
- Add a root `README.md` documenting prerequisites and commands to install, run, test, build, and package the app for Windows/macOS.

**Non-Goals:**
- No use of `git filter-repo` or BFG Repo-Cleaner — unnecessary complexity given there is only one commit and it has never been shared.
- No `git gc` / repo-size verification task — the amend itself is sufficient; deep verification of reclaimed disk space is out of scope.
- No changes to `app/package.json` (e.g., adding an `engines` field) — the README states a recommended minimum Node version in prose instead.
- No Linux support documentation — the app targets Windows and macOS only.
- No bilingual (English/Spanish) README — this is a repository/developer document, not application UI content, so English only.
- No changes to application source code, build tooling, or CI — this change is purely repository hygiene and documentation.

## Decisions

1. **Amend the existing commit instead of adding a new "cleanup" commit on top.**
   Because `origin` has no remote branches, rewriting the sole local commit carries no risk of disrupting shared history. Amending keeps history clean (one legitimate "first commit" instead of "first commit" + "oops, fix tracking" as two commits). Alternative considered: `git filter-repo`/BFG — rejected as overkill for a single-commit, unpublished repo.

2. **Order of operations: untrack bloat and amend FIRST, then add README.md/.gitignore as new commit(s) afterward.**
   This keeps the amended commit's diff minimal and easy to reason about (pure removal), and cleanly separates "fixing a mistake" from "adding new documentation" in the history. Alternative considered: folding everything into one amended commit — rejected per user preference for clearer, single-purpose commits.

3. **`.gitignore` scope: comprehensive Node/Electron template, not just the specific paths causing problems today.**
   Covers `node_modules/`, `dist/`, `out/`, `*.tsbuildinfo`, `.env*`, OS cruft (`.DS_Store`, `Thumbs.db`), editor directories (`.vscode/`, `.idea/`), npm/yarn logs, and `coverage/`. This prevents a broader class of future accidental commits, not just a recurrence of today's exact issue.

4. **README requirements section states "Node 20+" as a recommendation, without adding an `engines` field to `package.json`.**
   Keeps documentation and packaging concerns separate; avoids introducing an enforcement mechanism not explicitly requested.

## Risks / Trade-offs

- [Amending the commit changes its hash] → Mitigation: acceptable because `origin` has no remote branches — nothing else references the old hash.
- [Untracking `app/dist`/`app/out` removes tracked build artifacts, but they are regenerable via `npm run build`/`dist:win`/`dist:mac`] → Mitigation: README documents these commands so they can be regenerated on demand.
- [A comprehensive `.gitignore` might hide a future intentionally-committed file matching a broad pattern (e.g., a needed `.env.example`)] → Mitigation: use `.env*` with a `!.env.example` negation only if/when such a file is actually needed (not needed today).

## Migration Plan

1. `git rm -r --cached app/node_modules app/dist app/out app/tsconfig.node.tsbuildinfo app/tsconfig.web.tsbuildinfo` (untrack, keep working-tree files).
2. `git commit --amend --no-edit` (folds the untracking into the existing single commit, preserving its original message and authorship metadata). At this point history contains only the 73 legitimate files.
3. Add root `.gitignore` and root `README.md`; commit them as one or more new commits on top (e.g., `git commit -m "chore: add .gitignore"` and `git commit -m "docs: add README"`), keeping the amend's diff pure removal.
4. No rollback needed beyond standard git history editing (`git reset`) since nothing has been pushed.

## Open Questions

None — all decisions were confirmed with the user during the exploration phase.
