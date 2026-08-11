# Git Evidence Generator

Personal desktop tool for generating PDF evidence of work done across Git repositories. Given one or more repositories, a time frame, and a list of people to track, it scans commit history and produces one PDF per person summarizing their commits and diffs.

> This project is for personal/internal use only and is distributed as `UNLICENSED` — no license is granted for external use or redistribution.

## Requirements

- **Node.js 20+** (recommended minimum)
- **Git** installed and available on your `PATH` (the app shells out to the system Git binary to scan repositories)
- **Supported platforms**: Windows and macOS

## Getting Started

Install dependencies from the `app` directory:

```bash
cd app
npm install
```

Run the app in development mode (hot reload):

```bash
npm run dev
```

## Other Commands

Run these from the `app` directory as well:

| Command | Description |
| --- | --- |
| `npm run typecheck` | Type-check the project with TypeScript |
| `npm run lint` | Lint the codebase |
| `npm run test` | Run the test suite |
| `npm run build` | Build the app for production |
| `npm run dist:win` | Package a distributable installer for Windows |
| `npm run dist:mac` | Package a distributable installer for macOS |
