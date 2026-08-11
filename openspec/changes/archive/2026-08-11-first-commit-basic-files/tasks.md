## 1. Untrack previously committed build artifacts

- [x] 1.1 Run `git rm -r --cached app/node_modules app/dist app/out app/tsconfig.node.tsbuildinfo app/tsconfig.web.tsbuildinfo` from the repository root to untrack the bloat while preserving the working-tree files
- [x] 1.2 Verify with `git status` that these paths now show as untracked/ignored candidates (not staged for deletion in the working tree)

## 2. Add root .gitignore

- [x] 2.1 Create root-level `.gitignore` covering: `node_modules/`, `dist/`, `out/`, `*.tsbuildinfo`, `.env*`, `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`, npm/yarn debug logs (`npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`), and `coverage/`
- [x] 2.2 Stage the `.gitignore` file with `git add .gitignore`
- [x] 2.3 Verify with `git status` that no previously-bloat paths reappear as untracked after adding `.gitignore`

## 3. Amend the existing commit to remove bloat

- [x] 3.1 Confirm `origin` has no remote branches (`git branch -r` returns nothing) before amending, to ensure it is safe to rewrite the sole local commit
- [x] 3.2 Run `git commit --amend --no-edit` to fold the untracking (task 1) and `.gitignore` addition (task 2) into the existing single commit, preserving its original message and author/date metadata
- [x] 3.3 Verify with `git ls-files` that no path under `app/node_modules`, `app/dist`, `app/out`, `app/tsconfig.node.tsbuildinfo`, or `app/tsconfig.web.tsbuildinfo` remains tracked
- [x] 3.4 Verify with `git log --oneline` that there is still exactly one commit in history

## 4. Add root README.md

- [x] 4.1 Draft `README.md` with: a brief project description (derived from `app/package.json`'s `description` field) and a note that it is UNLICENSED/personal-use only
- [x] 4.2 Add a "Requirements" section documenting Node.js 20+ (recommended minimum), Git installed and available on PATH, and supported platforms (Windows, macOS)
- [x] 4.3 Add a "Getting Started" / commands section documenting: `npm install` (run from `app/`), `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run dist:win`, `npm run dist:mac`
- [x] 4.4 Commit `README.md` as a new commit on top of the amended commit (e.g., `git commit -m "docs: add README"`)

## 5. Final verification

- [x] 5.1 Confirm a fresh look at `git status` shows a clean working tree (no unexpected untracked/modified files)
- [x] 5.2 Confirm `git ls-files` output contains only legitimate source/config files plus the new `README.md` and `.gitignore`
- [x] 5.3 Confirm `app/node_modules` and `app/dist` still physically exist on disk (untouched in the working tree) so local development is unaffected
