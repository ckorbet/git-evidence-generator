## Why

There is currently no lightweight, personal-use tool to produce trustworthy, shareable PDF evidence of work performed across one or more Git repositories over a given time frame. A legacy internal CLI tool (`gitlog.jar`, JGit + PDFBox based) proved the core idea — clone repos, scan commits/diffs in a date range, redact sensitive words, and emit a PDF per author — but it is a command-line-only tool with no persisted configuration, fragile author-name-based grouping, no cross-platform desktop UX, and no reuse across runs. We need a proper Windows/macOS desktop application that builds on those proven ideas while fixing their shortcomings (identity aliasing, reusable profiles, safer credential storage, richer report structure, localization) and follows modern architecture/maintainability practices.

## What Changes

- New Electron + React desktop application (Windows + macOS) with a sidebar navigation: profile selector, Dashboard, Generate Report, Profiles, Settings.
- **Profiles**: named, fully self-contained configurations (repositories, tracked people/aliases, blacklist words, file-extension whitelist, shared git credential) persisted as one JSON file per profile; profile switching repopulates all dependent screens.
- **Git repository scanning**: local clone/fetch via `simple-git` (shelling to the system `git` binary) for any Git host over HTTPS using a single username + Personal Access Token per profile; optional `url [branch]` syntax per repository line; per-repository failures are logged and skipped without aborting the whole run.
- **Identity matching**: one line per tracked person (`Name: alias1, alias2, ...`), aliases matched case-insensitively against commit author name/email, replacing the legacy tool's fragile single-author-name grouping.
- **Content filtering**: blacklist-word redaction (case-insensitive, replaces the matched token only) applied to commit messages, diff content, and file paths; configurable file-extension whitelist (broadened sensible default, fully editable, empty list = include all); automatic skipping of binary files with a warning shown both on-screen and inline in the generated PDF.
- **Report generation**: one PDF per tracked person per run, combining all of that person's matched commits across all repositories in the profile; report structure is a cover/summary page (totals: commits, repos touched, lines added/removed, date range) followed by an Index (commit list) and Detail (full colorized diff, legacy-style) section; rendered via HTML/CSS through Electron's Chromium print-to-PDF; PDF text follows the app's active UI language; output files are saved permanently to a configurable global output directory, auto-subfoldered per profile, using a deterministic `<Profile>_<Person>_<From>-<To>.pdf` naming convention.
- **Report history (Dashboard)**: a history list scoped to the currently active profile, storing a full parameter snapshot per past run; if a historical PDF file is missing from disk, the user can regenerate it using the original snapshot (not the profile's current, possibly since-modified, settings).
- **Settings**: application-wide preferences — Appearance (System/Dark/Light), Language (English/Spanish, English default), and the default output directory.
- **Localization**: a structured i18n framework with complete English and Spanish translations across all screens and generated PDF labels, designed to accommodate future languages.
- Credentials are encrypted at rest via Electron's `safeStorage` API, scoped per profile.
- Out of scope for this change (v1): SVN support, pull/merge request metadata, PDF password protection/encryption, code signing and auto-update, multi-host credentials within a single profile, and syntax-highlighted/line-numbered diff rendering.

## Capabilities

### New Capabilities
- `profile-management`: creating, editing, deleting, and switching named profiles; persisting profile configuration (repositories, tracked people, blacklist words, extension whitelist) as one JSON file per profile; securely storing and retrieving the per-profile git credential (username + PAT) via OS-level encryption.
- `repository-scanning`: cloning/fetching configured Git repositories over HTTPS with a shared per-profile credential, resolving optional branch overrides, filtering commits by date range, and retrieving full diffs while tolerating and reporting individual repository failures without aborting the run.
- `identity-matching`: parsing the per-profile list of tracked people and their aliases, and matching git commit author identity (name/email) against those aliases to attribute each commit to the correct canonical person.
- `content-filtering`: redacting configured blacklist words within commit messages, diff content, and file paths; including/excluding files by extension whitelist; detecting and skipping binary file diffs with a recorded warning.
- `report-generation`: assembling and rendering one PDF report per tracked person (cover/summary, index, detail sections) from the scanned, filtered commit data, honoring the active UI language, and writing the file to the configured, profile-subfoldered output directory using the defined naming convention.
- `report-history`: recording a snapshot of each report-generation run (parameters and output file location) scoped to its profile, listing this history on the Dashboard, and regenerating a report from its original snapshot when the saved PDF file is no longer present on disk.
- `app-settings`: managing application-wide preferences (appearance theme, UI language, default output directory) and applying them across the application.
- `localization`: providing a structured internationalization mechanism with complete English and Spanish translations for all UI surfaces and generated PDF report text.

### Modified Capabilities
- None — this is a net-new application with no pre-existing specs.

## Impact

- **New codebase**: Electron main + renderer (React) processes, IPC boundaries between them, and a backend "core" layer (repository scanning, identity matching, content filtering, report generation) that is UI-framework-agnostic to maximize testability and maintainability.
- **New dependencies**: Electron, React, `simple-git`, an HTML-to-PDF templating/rendering approach built on Electron's Chromium (`webContents.printToPDF`), an i18n library (e.g. `i18next`), and Electron's built-in `safeStorage` for credential encryption.
- **New persisted data**: per-profile JSON configuration files, per-profile report-history entries, and application-level settings, stored under the OS-appropriate Electron `userData` directory.
- **Platforms**: Windows and macOS desktop builds (unsigned, internal/personal distribution for v1).
- **No existing systems affected** — this is the first capability set for this application.
