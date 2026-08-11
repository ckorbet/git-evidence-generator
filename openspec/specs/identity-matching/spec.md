## Requirements

### Requirement: Define Tracked People and Aliases
The system SHALL allow each profile to define a list of tracked people, one entry per line, in the format `Display Name: alias1, alias2, ...`, where each alias is a git author name, email, or username fragment.

#### Scenario: Adding a person with multiple aliases
- **WHEN** the user adds an entry such as `Devon Lane: devon.lane@enterprise.com, dl-dev`
- **THEN** the system stores "Devon Lane" as the canonical display name with both provided strings as recognized aliases for matching

#### Scenario: Adding a person with a single alias
- **WHEN** the user adds an entry with a display name and exactly one alias
- **THEN** the system stores that single alias as sufficient to match commits to the person

### Requirement: Match Commit Author to Tracked Person
The system SHALL match each scanned commit's author (git author name and email) against every tracked person's aliases, case-insensitively, and attribute the commit to the first matching person.

#### Scenario: Match by email
- **WHEN** a commit's author email exactly matches one of a tracked person's configured aliases (case-insensitive)
- **THEN** the system attributes that commit to that tracked person

#### Scenario: Match by partial/username alias
- **WHEN** a commit's author name or email contains a tracked person's configured username-style alias as a substring (case-insensitive)
- **THEN** the system attributes that commit to that tracked person

#### Scenario: No matching person
- **WHEN** a commit's author does not match any tracked person's aliases
- **THEN** the system excludes that commit from all generated reports for the run

### Requirement: One Report Output Per Tracked Person
The system SHALL group all matched commits by the tracked person they were attributed to, so that report generation produces exactly one report per tracked person who has at least one matched commit in the run.

#### Scenario: Multiple tracked people with matched commits
- **WHEN** a scan run finds matched commits for two different tracked people
- **THEN** the system produces two separate report outputs, one per person, each containing only that person's matched commits

#### Scenario: Tracked person with zero matched commits
- **WHEN** a tracked person configured in the profile has no matched commits within the requested date range
- **THEN** the system does not generate a report for that person for that run
