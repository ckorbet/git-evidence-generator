## Requirements

### Requirement: File Extension Whitelist Filtering
The system SHALL allow each profile to define a whitelist of file extensions, and SHALL include only files whose path matches one of the whitelisted extensions in report content; an empty whitelist SHALL be treated as "include all file types."

#### Scenario: File matches whitelist
- **WHEN** a changed file's extension is present in the profile's whitelist
- **THEN** the system includes that file's diff in the report

#### Scenario: File does not match whitelist
- **WHEN** a changed file's extension is not present in the profile's non-empty whitelist
- **THEN** the system excludes that file's diff from the report entirely

#### Scenario: Empty whitelist includes all files
- **WHEN** the profile's extension whitelist is empty
- **THEN** the system includes files of all extensions, subject to other filtering rules (binary detection)

### Requirement: Sensible Default Whitelist for New Profiles
The system SHALL pre-populate the file-extension whitelist with a broadened default list of common source-code extensions when a new profile is created, while allowing the user to fully edit or clear it.

#### Scenario: New profile default
- **WHEN** the user creates a new profile
- **THEN** the extension whitelist field is pre-filled with the default list, which the user may edit or clear

### Requirement: Binary File Detection and Skipping
The system SHALL detect binary files among a commit's changed files and SHALL exclude their content from diff rendering, recording a warning for each skipped file instead of raising an error.

#### Scenario: Binary file encountered
- **WHEN** a changed file in an in-range commit is detected as binary
- **THEN** the system skips rendering that file's diff content and records a skipped-binary-file warning identifying the repository, commit, and file path

#### Scenario: Binary skip warnings are surfaced to the user
- **WHEN** one or more binary files were skipped during a report generation run
- **THEN** the system displays a summary of the skipped files on screen after generation completes, and includes an inline note at the corresponding point of each affected person's generated PDF

### Requirement: Blacklist Word Redaction
The system SHALL redact each configured blacklist word, case-insensitively, wherever it appears in a commit's message, diff content, or file path, replacing only the matched word/token rather than the surrounding text.

#### Scenario: Blacklist word found in diff content
- **WHEN** a blacklist word appears within a line of diff content
- **THEN** the system replaces only the matched word with a redaction marker, preserving the rest of the line

#### Scenario: Blacklist word found in commit message
- **WHEN** a blacklist word appears anywhere in a commit's full message
- **THEN** the system replaces only the matched word with a redaction marker in the rendered report

#### Scenario: Blacklist word found in a file path
- **WHEN** a blacklist word appears within a changed file's path
- **THEN** the system replaces only the matched word with a redaction marker wherever that path is displayed in the report

#### Scenario: No blacklist words configured
- **WHEN** a profile's blacklist word list is empty
- **THEN** the system performs no redaction and renders commit messages, diffs, and file paths unmodified
