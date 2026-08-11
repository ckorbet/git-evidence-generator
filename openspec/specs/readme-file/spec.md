## Requirements

### Requirement: Root README file
The repository SHALL contain a root-level `README.md` written in English that describes the project and documents the prerequisites and commands needed to install, run, test, build, and package the application.

#### Scenario: Project description is present
- **WHEN** a reader opens `README.md`
- **THEN** it SHALL contain a brief description of what the application does and a note that it is for personal/internal use only (UNLICENSED)

#### Scenario: Prerequisites are documented
- **WHEN** a reader consults the requirements section of `README.md`
- **THEN** it SHALL state Node.js 20+ as the recommended minimum version, Git installed and available on PATH, and that the application supports Windows and macOS

#### Scenario: Install and run commands are documented
- **WHEN** a reader follows `README.md` to set up the project
- **THEN** it SHALL document running `npm install` from the `app/` directory followed by `npm run dev` to start the application in development mode

#### Scenario: Quality and build commands are documented
- **WHEN** a reader consults `README.md` for additional development commands
- **THEN** it SHALL document `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and the packaging commands `npm run dist:win` and `npm run dist:mac`
