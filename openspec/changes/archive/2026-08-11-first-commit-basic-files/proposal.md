## Why

The repository currently has no `README.md` (no documented requirements or commands to run the app) and no `.gitignore`. As a direct consequence, the single existing commit ("first commit") accidentally tracked `app/node_modules` (14,002 files), `app/dist` (78 files, including a built installer), `app/out` (5 files), and TypeScript incremental build caches (`app/tsconfig.node.tsbuildinfo`, `app/tsconfig.web.tsbuildinfo`) — inflating `.git` to ~278MB from only 73 legitimate source/config files. Since the repository has never been pushed to its `origin` remote (no remote branches exist), this is a rare opportunity to clean up the commit in place before any history is shared.

## What Changes

- Add a root `.gitignore` covering `node_modules/`, `dist/`, `out/`, `*.tsbuildinfo`, `.env*`, OS cruft (`.DS_Store`, `Thumbs.db`), editor directories (`.vscode/`, `.idea/`), npm/yarn logs, and `coverage/`.
- Untrack the already-committed bloat (`app/node_modules`, `app/dist`, `app/out`, `app/tsconfig.*.tsbuildinfo`) via `git rm --cached`.
- **BREAKING**: Amend the single existing local commit in place to remove the bloat from history (safe because it has never been pushed to `origin`), rather than adding a new commit on top of the bloated one. This rewrites the existing commit hash.
- Add a root `README.md` with a brief project description, prerequisites (Node 20+, Git on PATH, Windows/macOS), and commands to install, run in dev mode, typecheck/lint/test, build, and package (`dist:win`/`dist:mac`).
- Add the new `README.md` and `.gitignore` files as separate commit(s) after the history amend.

## Capabilities

### New Capabilities
- `gitignore-file`: Defines the root `.gitignore` rules and the one-time cleanup of already-tracked build/dependency artifacts from git history.
- `readme-file`: Defines the root `README.md` content — project description, prerequisites, and commands to run/build/package the application.

### Modified Capabilities
_None — no existing specs are affected; this is the first change introducing repository hygiene documentation._

## Impact

- **Affected paths**: repository root (`README.md`, `.gitignore` — new files), git index/history (`app/node_modules`, `app/dist`, `app/out`, `app/tsconfig.*.tsbuildinfo` removed from tracking).
- **Affected systems**: local git history only (single commit amended in place); no impact on `app/` source code, build tooling, or the application itself.
- **Dependencies**: none — no new tooling required (amend uses plain `git rm --cached` + `git commit --amend`, no `filter-repo`/BFG needed since the repo is unpublished).
- **Risk**: amending a commit changes its hash. Acceptable here only because `origin` has no remote branches/history yet, so nothing is rewritten from another user's perspective.
