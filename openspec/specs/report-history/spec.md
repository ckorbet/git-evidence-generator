## Requirements

### Requirement: Record Report Generation Snapshot
The system SHALL record a history entry for each report-generation run, scoped to the profile that generated it, capturing a full snapshot of the parameters used (resolved repository list, tracked people/aliases, blacklist words, extension whitelist, date range, and profile name) and the output file path(s) produced.

#### Scenario: History entry created after generation
- **WHEN** a report generation run completes (fully or partially)
- **THEN** the system appends one history entry to the active profile's history file containing the run's parameter snapshot and resulting output file paths

### Requirement: Dashboard History Scoped to Active Profile
The system SHALL display, on the Dashboard, the report-generation history for only the currently active profile.

#### Scenario: Switching profiles updates the Dashboard
- **WHEN** the user switches the active profile using the profile selector
- **THEN** the Dashboard's history list updates to show only the newly active profile's history entries

### Requirement: Detect Missing Output File
The system SHALL detect when a history entry's referenced output PDF file no longer exists at its recorded location.

#### Scenario: Viewing history with a missing file
- **WHEN** the user views a history entry whose recorded output file path does not exist on disk
- **THEN** the system indicates the file is missing and offers a regeneration action instead of an "open" action

### Requirement: Regenerate Report from Snapshot
The system SHALL allow the user to regenerate a report from an existing history entry, using that entry's originally recorded parameter snapshot rather than the profile's current live configuration.

#### Scenario: Regenerating after the profile has changed
- **WHEN** the user regenerates a history entry whose profile has since been edited (e.g. blacklist words changed)
- **THEN** the system performs the scan and render using the history entry's original snapshot values, producing a PDF equivalent to the one originally generated

#### Scenario: Regenerated file updates history location
- **WHEN** a regeneration completes successfully
- **THEN** the system updates the history entry's output file path to the newly written file's location
