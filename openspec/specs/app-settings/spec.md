## Requirements

### Requirement: Appearance Setting
The system SHALL allow the user to choose an application appearance of System, Dark, or Light from the Settings screen, applied across the entire application.

#### Scenario: Selecting a fixed appearance
- **WHEN** the user selects "Dark" or "Light" in Settings
- **THEN** the application immediately applies that theme regardless of the operating system's current theme

#### Scenario: Selecting System appearance
- **WHEN** the user selects "System" in Settings
- **THEN** the application follows the operating system's current light/dark theme and updates automatically if the OS theme changes

### Requirement: Language Setting
The system SHALL allow the user to choose the application language (English or Spanish) from the Settings screen, defaulting to English, and SHALL apply the selected language to both the user interface and subsequently generated PDF reports.

#### Scenario: Default language on first run
- **WHEN** the application is run for the first time with no prior language preference stored
- **THEN** the active language defaults to English

#### Scenario: Changing the language
- **WHEN** the user selects a different language in Settings
- **THEN** all UI screens immediately update to display text in the newly selected language, and subsequently generated reports use that language

### Requirement: Default Output Directory Setting
The system SHALL allow the user to configure, from the Settings screen, the default output directory under which generated PDFs are saved (profile-subfoldered per the report-generation naming rules).

#### Scenario: Changing the output directory
- **WHEN** the user selects a new default output directory in Settings
- **THEN** subsequent report generations save their output under the newly configured directory, without moving or affecting previously generated files
