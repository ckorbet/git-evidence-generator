## Requirements

### Requirement: Create Profile
The system SHALL allow the user to create a new named profile containing: a repository list, a tracked-people list, a blacklist-word list, a file-extension whitelist, and a git credential (username + Personal Access Token).

#### Scenario: Creating a profile with a unique name
- **WHEN** the user submits a new profile name that does not match any existing profile
- **THEN** the system creates a new profile with empty/default field values and persists it as its own JSON file

#### Scenario: Rejecting a duplicate profile name
- **WHEN** the user submits a new profile name that matches an existing profile's name
- **THEN** the system rejects the creation and displays an error indicating the name is already in use

### Requirement: Edit Profile
The system SHALL allow the user to edit all fields of an existing profile (repositories, tracked people, blacklist words, extension whitelist, credential) from the Profiles section.

#### Scenario: Saving edits to a profile
- **WHEN** the user modifies one or more fields of a profile and saves
- **THEN** the system persists the updated values to that profile's JSON file, leaving other profiles unaffected

### Requirement: Delete Profile
The system SHALL allow the user to delete an existing profile, after explicit confirmation, permanently removing its configuration.

#### Scenario: Deleting the active profile
- **WHEN** the user deletes the profile that is currently active
- **THEN** the system removes the profile's configuration file, clears the active-profile selection, and returns the application to the no-profile-selected state

#### Scenario: Deleting a profile does not remove its report history or generated PDFs
- **WHEN** the user deletes a profile that has existing report history
- **THEN** the system leaves previously generated PDF files on disk untouched (deletion only removes the profile configuration; history/report retention is out of scope for this requirement)

### Requirement: Select Active Profile
The system SHALL provide a profile selector, shown at the top of the sidebar navigation, that lets the user choose which saved profile is currently active.

#### Scenario: Switching the active profile
- **WHEN** the user selects a different profile from the selector
- **THEN** the Generate Report screen, Dashboard history, and Profiles editing view all reflect the newly selected profile's data

#### Scenario: No profiles exist yet
- **WHEN** the application has zero saved profiles
- **THEN** the profile selector shows an empty/prompt state and the Generate Report screen displays guidance directing the user to create a profile in the Profiles section, without blocking access to other screens

### Requirement: Persist Profile Configuration
The system SHALL persist each profile's configuration as its own individual JSON file under the application's user data directory, written atomically to prevent partial/corrupted writes.

#### Scenario: Atomic write on save
- **WHEN** a profile is created or edited
- **THEN** the system writes the updated configuration to a temporary file and atomically renames it into place, so an interrupted write never leaves a corrupted profile file

### Requirement: Encrypted Credential Storage
The system SHALL store each profile's git credential (username + Personal Access Token) encrypted at rest using the operating system's native encryption, and SHALL never expose the decrypted credential outside the main process or write it to logs.

#### Scenario: Storing a new credential
- **WHEN** the user enters a username and PAT for a profile and saves
- **THEN** the system encrypts the PAT before persisting it to the profile's configuration file

#### Scenario: Using a stored credential
- **WHEN** the system needs to authenticate a git operation for a profile
- **THEN** the system decrypts the credential in the main process immediately before use and does not transmit the decrypted value to the renderer process or any log output
