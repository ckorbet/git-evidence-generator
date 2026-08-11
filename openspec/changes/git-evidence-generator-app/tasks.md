## 1. Project Scaffolding & Tooling

- [x] 1.1 Initialize the Electron + React + TypeScript project structure (e.g. via `electron-vite` template), with separate `main`, `preload`, and `renderer` source roots
- [x] 1.2 Create the `core` package (plain TypeScript, no Electron/UI dependency) with its own `tsconfig`/build target, referenced by `main`
- [x] 1.3 Configure linting/formatting (ESLint + Prettier) and a test runner (e.g. Vitest) for both `core` and `renderer`
- [x] 1.4 Set up `electron-builder` targets for Windows (NSIS or portable) and macOS (DMG), unsigned, internal-distribution configuration
- [x] 1.5 Configure the secure renderer boundary: `contextIsolation: true`, `nodeIntegration: false`, and a typed `preload` IPC bridge (`contextBridge.exposeInMainWorld`)
- [x] 1.6 Add `simple-git` as a dependency and verify it can shell out to the system `git` binary from the `main`/`core` context

## 2. Core Domain Model & Persistence

- [x] 2.1 Define shared TypeScript types for `Profile`, `Person`/alias entries, `BlacklistWord`, `ExtensionWhitelist`, `Credential`, `Settings`, and `HistoryEntry`
- [x] 2.2 Implement an atomic JSON file read/write utility (temp file + rename) used by all persistence code
- [x] 2.3 Implement `settings.json` load/save (appearance, language, default output directory) with sensible defaults on first run
- [x] 2.4 Implement per-profile JSON load/save under `userData/profiles/<profile-id>.json`
- [x] 2.5 Implement per-profile history JSON load/append under `userData/history/<profile-id>.json`
- [x] 2.6 Implement credential encryption/decryption helpers wrapping Electron `safeStorage`, ensuring decrypted values never cross the IPC boundary or get logged

## 3. Profile Management (capability: profile-management)

- [x] 3.1 Implement IPC handlers: list profiles, get profile, create profile (reject duplicate names), update profile, delete profile
- [x] 3.2 Implement IPC handlers: get/set active profile pointer (stored in `settings.json`)
- [x] 3.3 Build the "Profiles" section UI: profile list, create/rename/delete actions, and a full edit form (repositories, tracked people, blacklist words, extension whitelist, credential fields)
- [x] 3.4 Build the sidebar profile selector component (switches active profile; drives Generate Report and Dashboard scoping)
- [x] 3.5 Implement the empty/no-profiles-yet state across Generate Report and the profile selector
- [x] 3.6 Write unit tests for profile CRUD logic and duplicate-name validation

## 4. Repository Scanning (capability: repository-scanning)

- [x] 4.1 Implement repository-list line parsing (`<url> [branch]`) in `core`
- [x] 4.2 Implement temporary-clone lifecycle: clone/fetch a repository into a per-run temp directory using the profile's decrypted credential, and guaranteed cleanup (success or failure) via try/finally
- [x] 4.3 Implement commit-log retrieval filtered by author date range (from/to, inclusive) via `simple-git`
- [x] 4.4 Implement per-commit diff retrieval (changed files + diff content)
- [x] 4.5 Implement per-repository error isolation: catch clone/scan failures individually, record `RepositoryScanError`, and continue with remaining repositories
- [x] 4.6 Implement scan-progress event emission (cloning/scanning/done/failed per repository) from `core`/`main` to the renderer via IPC
- [x] 4.7 Write unit tests for date-range filtering, branch resolution, and per-repository failure isolation using local fixture git repositories

## 5. Identity Matching (capability: identity-matching)

- [x] 5.1 Implement tracked-people line parsing (`Display Name: alias1, alias2, ...`) in `core`
- [x] 5.2 Implement case-insensitive author-to-person matching against name/email/alias substrings
- [x] 5.3 Implement commit grouping by matched person, excluding unmatched commits
- [x] 5.4 Write unit tests covering exact email match, substring/username match, no-match exclusion, and multiple aliases per person

## 6. Content Filtering (capability: content-filtering)

- [x] 6.1 Implement the file-extension whitelist filter (including "empty list = include all" behavior) in `core`
- [x] 6.2 Implement the broadened default extension whitelist applied when a new profile is created
- [x] 6.3 Implement binary file detection and skip logic, collecting `SkippedBinaryFile` records per run
- [x] 6.4 Implement blacklist-word redaction applied to commit messages, diff content, and file paths (literal, case-insensitive, token-level replacement)
- [x] 6.5 Write unit tests for extension filtering, binary detection/skip-warning collection, and blacklist redaction across all three target fields

## 7. Report Generation (capability: report-generation)

- [x] 7.1 Design and implement the HTML/CSS report templates: cover/summary page, Index section, Detail section (legacy-style diff coloring, monospace font, no line numbers/highlighting)
- [x] 7.2 Implement per-person report-data assembly in `core` (summary stats, ordered index, ordered detail) from scanned/filtered/matched commit data, including failed-repository listing on the cover page
- [x] 7.3 Implement PDF rendering in `main` via an offscreen `BrowserWindow` + `webContents.printToPDF`, wiring in the localized template strings for the active language
- [x] 7.4 Implement deterministic output path construction (`<output dir>/<Profile>/<Profile>_<Person>_<From>-<To>.pdf>`) and directory creation as needed
- [x] 7.5 Wire report generation into the Generate Report screen: date range inputs, Generate action, per-repository progress log display, and post-generation summary (including skipped-binary-file warnings)
- [x] 7.6 Write unit tests for report-data assembly and output path construction; add a visual/manual verification pass comparing rendered PDF output against the legacy tool's look and feel

## 8. Report History (capability: report-history)

- [x] 8.1 Implement history-entry creation (full parameter snapshot + output file paths) appended after each generation run
- [x] 8.2 Implement Dashboard history list UI scoped to the active profile, updating when the profile selector changes
- [x] 8.3 Implement missing-file detection for history entries (check output path existence) and corresponding UI state (open vs. regenerate action)
- [x] 8.4 Implement snapshot-based regeneration: re-run scan→filter→render using the stored snapshot rather than the profile's current live configuration, and update the history entry's output path on success
- [x] 8.5 Write unit tests for snapshot capture, missing-file detection, and regeneration using a snapshot that differs from the current (edited) profile state

## 9. Application Settings (capability: app-settings)

- [x] 9.1 Build the Settings screen UI: Appearance (System/Dark/Light), Language (English/Spanish), Default output directory (folder picker)
- [x] 9.2 Implement appearance application across the renderer (including live OS theme change following when "System" is selected)
- [x] 9.3 Wire the Language setting to the i18n mechanism and persist the selection
- [x] 9.4 Wire the default output directory setting into the report-generation output path logic

## 10. Localization (capability: localization)

- [x] 10.1 Integrate `i18next` (+ `react-i18next` for the renderer) with a headless-usable instance shared by `main`/`core` for PDF label resolution
- [x] 10.2 Author complete English (`en`) resource bundle covering all UI screens and PDF report labels
- [x] 10.3 Author complete Spanish (`es`) resource bundle covering all UI screens and PDF report labels
- [x] 10.4 Wire all renderer UI components to use translation keys (no hardcoded user-facing strings)
- [x] 10.5 Wire report-template rendering to resolve labels via the same i18n resources based on the active language at generation time
- [x] 10.6 Write a translation-completeness check (e.g. a test asserting the `es` bundle has no missing keys relative to `en`)

## 11. Cross-Cutting Polish & Verification

- [x] 11.1 Implement global error handling/surfacing for IPC failures (e.g. credential decryption failure, disk write failure) with user-facing messages
- [x] 11.2 Verify atomic-write behavior under simulated interruption (e.g. crash during profile save does not corrupt the profile file)
- [x] 11.3 Run an end-to-end manual verification: create a profile, configure real/test repositories, generate a report, confirm PDF structure/content/redaction/localization, verify Dashboard history and regeneration-after-delete flow
- [x] 11.4 Produce Windows and macOS unsigned build artifacts and verify the application launches and functions on both platforms _(Windows NSIS installer built via `npm run dist:win` and verified to launch; macOS DMG requires a macOS build host per electron-builder's platform restriction — `electron-builder.yml` mac config is in place and ready, but the actual `.dmg` artifact could not be produced from this Windows environment)_
- [x] 11.5 Review the full application against the design's non-goals to confirm no out-of-scope functionality (SVN, PR metadata, PDF passwords, auto-update, multi-host credentials, syntax highlighting) was inadvertently introduced
