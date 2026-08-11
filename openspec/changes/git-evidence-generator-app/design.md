## Context

This is a greenfield desktop application (no existing codebase, no prior specs). It replaces a legacy internal Java CLI tool (`gitlog.jar`, built on JGit + PDFBox) that proved the core value proposition — clone repositories, scan commits/diffs in a date range, redact sensitive words, and emit PDF evidence per author — but had no persisted configuration, no GUI, fragile identity handling (grouped strictly by raw git author name), and no localization.

The target users are individuals doing personal tracking/evidence-of-work reporting across one or more Git repositories, for themselves and/or other tracked people, typically per client/engagement. The application must run on Windows and macOS, for internal/personal use (unsigned distribution, no auto-update requirement).

Constraints established during requirements discovery (see `proposal.md`):
- Electron + React, single shared git credential (username + PAT) per profile, local git clone only (no provider REST APIs), one PDF per tracked person per run, JSON-file persistence (no embedded database), full English/Spanish localization from v1.

## Goals / Non-Goals

**Goals:**
- Establish a clean, layered architecture that separates Electron platform concerns (windowing, IPC, OS integration) from a portable "core" domain layer (git scanning, identity matching, content filtering, report generation) that can be unit-tested without Electron running.
- Define the data model and file layout for profiles, credentials, settings, and report history so that all persisted state is predictable, inspectable, and safe to hand-edit or back up.
- Define the report-generation pipeline (scan → match → filter → render → save) as a single, well-defined sequence of pure/composable steps.
- Define the localization approach so every user-facing string (UI and generated PDF) flows through one mechanism.
- Keep the design simple enough for a single developer to build and maintain, favoring boring, well-supported libraries over bespoke solutions.

**Non-Goals (v1 — explicitly deferred):**
- SVN or any non-Git version control support.
- Pull/merge request metadata (would require provider-specific REST APIs, breaking the host-agnostic local-clone model).
- PDF password protection/encryption or watermarking.
- Code signing, notarization, or auto-update infrastructure.
- Supporting multiple Git hosts/credentials within a single profile.
- Syntax highlighting, line numbers, or advanced diff rendering beyond the legacy-style colored-background view.
- Multi-user/networked/server-side deployment — this is a single-user local desktop application.

## Decisions

### 1. Process architecture: Electron main + renderer + isolated "core" package
The application is split into three layers:
- **`core`** — a plain TypeScript/Node package with no Electron or UI dependency: git scanning (`simple-git`), identity matching, content filtering, report-data assembly, and PDF HTML template generation. Fully unit-testable in isolation (mock repos/fixtures, no Electron runtime needed).
- **`main`** (Electron main process) — owns windowing, IPC handlers, filesystem access (profile/settings JSON, output directory), credential encryption (`safeStorage`), and orchestrates `core` calls, and drives the print-to-PDF step (since only the main process can use `webContents.printToPDF`).
- **`renderer`** (React) — pure UI, communicates with `main` exclusively via a typed IPC bridge (`contextBridge` + `ipcRenderer.invoke`), no direct Node/filesystem access (renderer runs with `contextIsolation: true`, `nodeIntegration: false`).

**Why**: Keeps business logic testable without spinning up Electron, enforces Electron's recommended security posture (isolated renderer), and gives a clear seam for future reuse (e.g., a CLI wrapper around `core` if ever needed).
**Alternative considered**: Single flat Electron app with logic inlined in main-process IPC handlers — rejected because it entangles business logic with Electron APIs, making unit testing harder and violating the "maintainability/adaptability" requirement.

### 2. Git access via `simple-git`, ephemeral local clones
Each repository is shallow-or-full cloned (implementation detail: start with full clone for correctness; revisit shallow/`--since` optimizations later) into a temporary directory under the OS temp path, scoped to a single report-generation run, and removed after the run completes (success or failure) to avoid unbounded disk usage. Commit history is filtered by author date range using `simple-git`'s log range/`--since`/`--until` options; diffs are retrieved per commit via `git show`/`git diff`.

**Why**: Matches the already-settled decision to require the system `git` binary (avoids native-module packaging pain from `nodegit`, avoids `isomorphic-git`'s fidelity gaps) and mirrors the legacy tool's proven clone-then-walk approach.
**Alternative considered**: Persisting clones between runs (caching) for speed — deferred; adds cache-invalidation complexity (branch moves, force-pushes) not justified for v1's personal-use scale.

### 3. Credentials: per-profile username + PAT via Electron `safeStorage`
Each profile's credential is encrypted with `safeStorage.encryptString` and the resulting buffer is stored base64-encoded inside that profile's JSON file (alongside its other config) or in a small sibling file — never in plaintext. Decryption happens only in the main process, immediately before invoking `simple-git`, and the decrypted value is never sent to the renderer or logged.

**Why**: `safeStorage` uses OS-level encryption (DPAPI on Windows, Keychain on macOS) with zero extra native dependencies to package/rebuild across both target platforms.
**Alternative considered**: `keytar` (native OS keychain wrapper) — rejected due to native-module rebuild/packaging overhead across Electron versions and two OSes, for no functional benefit over `safeStorage` here.

### 4. Data persistence: one JSON file per profile + separate settings/history files
Layout under Electron's `userData` directory:
```
userData/
  settings.json                # appearance, language, default output directory
  profiles/
    <profile-id>.json          # repos, people/aliases, blacklist, extensions, encrypted credential, active-profile pointer lives in settings.json
  history/
    <profile-id>.json          # array of past report-generation run snapshots + output file paths (kept separate from profile config so history growth never risks corrupting profile config, and vice versa)
```
Each write is performed atomically (write to a temp file in the same directory, then rename) to avoid partial/corrupted JSON on crash or power loss.

**Why**: JSON files are simple to inspect, back up, and diff; avoids introducing a database dependency (native module packaging, migrations) for what is a small, single-user dataset. Separating history from profile config keeps the "config is small and stable, history grows over time" concerns isolated.
**Alternative considered**: SQLite (`better-sqlite3`) — rejected per explicit requirement decision (round 4, Q5): unnecessary complexity/native dependency for this data scale.

### 5. Identity matching
Each profile stores tracked people as one entry per line: `Display Name: alias1, alias2, ...`. At scan time, for each commit, its author `name` and `email` (from git) are compared case-insensitively against every alias of every tracked person; the first matching person "claims" the commit. Commits matching no tracked person are excluded from all reports (the tool only reports on explicitly tracked people, consistent with the personal-tracking purpose). Matching is a pure function in `core` (`matchAuthorToPerson(author, people): Person | null`) covered by unit tests with fixture authors/aliases, including partial/substring alias matches (e.g. matching a username fragment appearing in a noreply email).

**Why**: Fixes the legacy tool's core weakness (grouping by raw, inconsistent author-name strings) while staying simple (no fuzzy/ML matching).

### 6. Content filtering pipeline
Filtering runs as an ordered pipeline over each commit's file diffs, in `core`:
1. **Extension filter** — a file is included only if its path matches the profile's extension whitelist (or all files if the whitelist is empty).
2. **Binary detection** — files git reports as binary (or where content contains a NUL byte) are excluded from diff rendering; a `SkippedBinaryFile` record (repo, commit, path) is collected for the run instead of raising an error.
3. **Blacklist redaction** — for included, non-binary files, every blacklist word (case-insensitive) is redacted (replaced token-for-token, not whole line) in: the diff content, the commit message, and the file path string itself, using word-boundary-aware regex construction to avoid accidental partial-word corruption while remaining a literal (non-regex-syntax) match against user-supplied blacklist entries.

**Why**: Keeps each filtering concern independently testable and mirrors the legacy tool's proven redaction approach while extending scope to file paths as required.

### 7. Report rendering: HTML/CSS templates + Electron `printToPDF`
`core` assembles a plain data structure per person (`PersonReportData`: summary stats, ordered commit index, ordered commit details with filtered diffs) and renders it to a static HTML string using a lightweight, dependency-light templating approach (template literal functions with escaping helpers, no client-side JS needed in the rendered document). The `main` process loads this HTML into an offscreen `BrowserWindow` and calls `webContents.printToPDF(...)`, writing the resulting buffer to disk.

**Why**: Reuses Chromium (already bundled with Electron) instead of a separate PDF-drawing library (`pdfkit`), letting the report layout (colors for diff add/remove/context, cover-page stats, index, detail sections) be expressed in ordinary CSS — much faster to iterate on and closest to a "make it look like the legacy PDF" outcome with minimal code.
**Alternative considered**: `pdfkit` (manual, programmatic layout) — rejected as more code for equivalent visual output, given Chromium is already available "for free" in Electron.

### 8. Localization
`i18next` (+ `react-i18next` for the renderer) with `en` and `es` resource bundles. A single source-of-truth resource namespace covers both UI strings and PDF report template strings (report section headers, date/number formatting), so the PDF generation step in `main`/`core` resolves strings via the same i18next instance (initialized headlessly, no React dependency) using the user's currently active Language setting. Adding a third language later means adding one more resource file — no structural change.

**Why**: `i18next` is the de facto standard, works both inside and outside React, and supports the "well-structured for future languages" requirement directly.

### 9. Report history & snapshot-based regeneration
Each report-generation run appends one entry to `history/<profile-id>.json` containing: the full **snapshot** of the parameters used (resolved repo list, resolved people/aliases, blacklist, extensions, date range, profile name) and the absolute output file path(s) produced. The Dashboard reads only the active profile's history file. If a listed output file no longer exists on disk (checked lazily, on view or on explicit user action), the UI offers "Regenerate," which re-runs the full scan→filter→render pipeline using the stored snapshot (not the profile's current live settings), guaranteeing the regenerated PDF matches the original evidence even if the profile has since been edited.

**Why**: Directly implements the explicit requirement that regeneration must reproduce the original evidence, not reflect later edits.

### 10. Error handling & partial-failure semantics
Repository-level failures (auth error, network failure, repo no longer exists) are caught per-repository inside the `core` scan loop, recorded as a `RepositoryScanError` (repo URL, error message), and do not abort the run — remaining repositories continue to be scanned. The Generate Report screen surfaces a live per-repository progress/status log (cloning → scanning → done/failed) fed by IPC progress events from `main`, and the final PDF's cover page lists any repositories that failed alongside the completed ones, so the report is transparent about its own completeness.

## Risks / Trade-offs

- **[Risk]** Cloning full repository history on every run may be slow for large/old repositories → **Mitigation**: v1 accepts this trade-off for correctness/simplicity; if it proves too slow in practice, a later change can introduce shallow clones bounded by the date range or persistent local mirrors with incremental fetch.
- **[Risk]** `webContents.printToPDF` layout/pagination control is less precise than a dedicated PDF library (page-break control, exact typography) → **Mitigation**: use CSS `page-break-*`/`break-inside: avoid` rules and validate visually against the legacy tool's output during implementation; escalate to `pdfkit` only if fidelity proves insufficient.
- **[Risk]** A single shared PAT per profile cannot span multiple hosts, and if it expires/is revoked, all repositories in that profile fail simultaneously → **Mitigation**: per-repository failure isolation (Decision 10) still lets already-succeeded repositories/people report correctly if partial credentials issues occur elsewhere; profile-level credential is an explicit, documented v1 constraint.
- **[Risk]** JSON-file persistence has no transactional guarantees across multiple files (e.g. history write succeeds, settings write fails) → **Mitigation**: atomic per-file writes (temp file + rename) bound the failure mode to "one file's last write is lost," never partial/corrupt file content.
- **[Risk]** Regenerating from a snapshot re-clones repositories that may have since been deleted, made private, or rewritten (force-push) → **Mitigation**: regeneration surfaces the same per-repository error handling as a fresh run; if a repo/commit is no longer reachable, that portion is reported as failed rather than silently producing a different result.
- **[Trade-off]** No syntax highlighting/line numbers in v1 diff rendering, matching legacy exactly → accepted per explicit requirement decision; revisit only if found lacking in practice.

## Migration Plan

Not applicable — this is a net-new, greenfield application with no prior version, users, or data to migrate. Initial rollout is a manual internal build/install on the developer's own Windows and macOS machines (unsigned installers), per the internal/personal distribution decision.

## Open Questions

None outstanding for v1 scope — all decisions surfaced during requirements discovery were resolved. The following are explicitly deferred (not open questions, but flagged here for future change proposals if priorities shift):
- Whether to add provider-specific PR/MR metadata via optional GitHub/GitLab REST integration.
- Whether to support multiple credentials/hosts per profile.
- Whether to add PDF password protection or code-signed/auto-updating installers if distribution scope ever expands beyond personal/internal use.
- Whether shallow/incremental cloning is needed once real-world repository sizes are exercised.
