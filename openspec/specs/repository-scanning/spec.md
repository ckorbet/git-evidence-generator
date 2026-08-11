## Requirements

### Requirement: Configure Repository List
The system SHALL allow each profile to define a list of Git repositories, one entry per line, each specifying a repository URL and an optional branch name (`<url> [branch]`).

#### Scenario: Repository entry without a branch
- **WHEN** a repository entry contains only a URL
- **THEN** the system scans that repository's default branch (the branch its remote `HEAD` points to)

#### Scenario: Repository entry with an explicit branch
- **WHEN** a repository entry contains a URL followed by a branch name
- **THEN** the system scans the specified branch instead of the default branch

### Requirement: Clone and Scan Repository Commits
The system SHALL clone or fetch each configured repository using the profile's stored credential, and SHALL retrieve commits whose author date falls within the report's requested date range.

#### Scenario: Successful scan within date range
- **WHEN** a repository is cloned successfully and contains commits with author dates between the requested "from" and "to" dates (inclusive)
- **THEN** the system includes those commits in the scan results for that repository

#### Scenario: No commits in range
- **WHEN** a repository contains no commits within the requested date range
- **THEN** the system records zero commits for that repository without treating it as an error

### Requirement: Retrieve Commit Diffs
The system SHALL retrieve the full diff content for each in-range commit, to be passed downstream for content filtering and report rendering.

#### Scenario: Commit with file changes
- **WHEN** an in-range commit modifies one or more files
- **THEN** the system retrieves the diff content for each changed file in that commit

### Requirement: Isolate Per-Repository Failures
The system SHALL isolate failures occurring while cloning or scanning an individual repository so that they do not prevent the scanning of other repositories in the same profile.

#### Scenario: One repository fails, others succeed
- **WHEN** one repository in the profile's list fails to clone (e.g. authentication error, network failure, or the repository no longer exists)
- **THEN** the system records the failure (repository URL and error message), continues scanning the remaining repositories, and includes the failure information in the final report and on-screen summary

### Requirement: Report Scan Progress
The system SHALL report per-repository progress during a scan (e.g. cloning, scanning commits, completed, or failed) to the user interface in real time.

#### Scenario: Progress updates during generation
- **WHEN** a report generation run is in progress
- **THEN** the Generate Report screen displays a live, per-repository status log reflecting each repository's current stage

### Requirement: Temporary Clone Cleanup
The system SHALL clone each repository into a temporary location scoped to a single report-generation run and SHALL remove that temporary clone after the run completes, whether it succeeds or fails.

#### Scenario: Cleanup after successful generation
- **WHEN** a report generation run completes successfully
- **THEN** the system deletes all temporary repository clones created for that run

#### Scenario: Cleanup after failed generation
- **WHEN** a report generation run fails or is aborted
- **THEN** the system still deletes any temporary repository clones already created for that run
