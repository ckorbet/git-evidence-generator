## ADDED Requirements

### Requirement: Report Structure
The system SHALL render each tracked person's PDF report with three sections, in order: a cover/summary page, an Index section, and a Detail section.

#### Scenario: Cover/summary page content
- **WHEN** a person's report is generated
- **THEN** the cover/summary page displays the total commit count, the number of distinct repositories touched, total lines added and removed, and the requested date range

#### Scenario: Index section content
- **WHEN** a person's report is generated
- **THEN** the Index section lists, per repository, each matched commit's message and identifying hash

#### Scenario: Detail section content
- **WHEN** a person's report is generated
- **THEN** the Detail section presents, per repository, the full filtered diff content for each matched commit

### Requirement: Legacy-Style Diff Rendering
The system SHALL render diff content in the Detail section using a monospace font with background colors distinguishing added lines, removed lines, and unchanged context lines, without line numbers or syntax highlighting.

#### Scenario: Added line rendering
- **WHEN** a diff line represents an added line
- **THEN** the system renders it with a distinct background color indicating an addition

#### Scenario: Removed line rendering
- **WHEN** a diff line represents a removed line
- **THEN** the system renders it with a distinct background color indicating a removal

#### Scenario: Context line rendering
- **WHEN** a diff line represents unchanged context
- **THEN** the system renders it with a neutral background color and no addition/removal styling

### Requirement: One PDF File Per Tracked Person
The system SHALL generate exactly one PDF file per tracked person who has matched commits in a given report-generation run.

#### Scenario: Single Generate action produces multiple files
- **WHEN** the user triggers report generation for a profile with matched commits for multiple tracked people
- **THEN** the system produces one PDF file per person, all as part of the same generation action

### Requirement: Deterministic Output File Naming and Location
The system SHALL save each generated PDF to a subfolder named after the profile, within the application's configured output directory, using the filename pattern `<ProfileName>_<PersonName>_<FromDate>-<ToDate>.pdf` with dates formatted as `YYYY-MM-DD`.

#### Scenario: Output path construction
- **WHEN** a report is generated for person "Devon Lane" in profile "ClientA" for the range 2024-01-01 to 2024-06-30
- **THEN** the system writes the file to `<configured output directory>/ClientA/ClientA_Devon Lane_2024-01-01-2024-06-30.pdf`

### Requirement: Localized Report Text
The system SHALL render all PDF report labels (section headers, field labels, and date formatting) in the application's currently active UI language at the time of generation.

#### Scenario: Generating with English active
- **WHEN** the application's active language is English at the time of generation
- **THEN** the generated PDF's labels and formatting appear in English

#### Scenario: Generating with Spanish active
- **WHEN** the application's active language is Spanish at the time of generation
- **THEN** the generated PDF's labels and formatting appear in Spanish

### Requirement: Report Reflects Repository Scan Failures
The system SHALL include, on each generated report's cover/summary page, a list of any repositories that failed to scan during that run.

#### Scenario: Partial run with one failed repository
- **WHEN** a report generation run completes with one repository having failed to scan
- **THEN** every affected person's generated report cover page lists that repository as failed, alongside the successfully scanned repositories
