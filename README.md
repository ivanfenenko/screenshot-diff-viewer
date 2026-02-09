# Paparazzi Compare

A cross-platform desktop application for comparing Paparazzi screenshot test results across different Git branches, tags, and commits.

## Features

- **Repository Selection**: Browse and select any Git repository containing Paparazzi screenshots
- **Auto-Detection**: Automatically finds screenshot directories in your repository
- **Git Integration**: Compare screenshots across branches, tags, or specific commits
- **Side-by-Side Comparison**: View screenshots side by side for easy visual comparison
- **Git LFS Support**: Automatically fetches LFS files on-demand when comparing
- **Search & Filter**: Quickly find specific screenshots with search functionality

## Prerequisites

- Node.js (v16 or higher)
- Rust and Cargo
- Git installed on your system
- Git LFS (if your screenshots are stored with LFS)

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd paparazzi-compare
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the application in development mode:

```bash
npm run tauri dev
```

## Building

Build the application for production:

```bash
npm run tauri build
```

This will create installers for your platform in `src-tauri/target/release/bundle/`.

## Usage

1. **Open Repository**: Click "Open Repository" and select a Git repository containing Paparazzi screenshots
2. **Browse Screenshots**: The app will automatically find and list all PNG screenshots
3. **View Screenshot**: Click on any screenshot in the list to view it
4. **Compare**: Click "Compare with..." to select a branch, tag, or commit hash
5. **Side-by-Side View**: Screenshots will be displayed side by side for easy comparison

## Technology Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Rust + Tauri
- **State Management**: Zustand
- **Icons**: Lucide React

## Project Structure

```
paparazzi-compare/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   └── App.tsx            # Main app component
├── src-tauri/             # Rust backend
│   └── src/
│       ├── git.rs         # Git operations
│       ├── scanner.rs     # Screenshot detection
│       └── lib.rs         # Tauri commands
└── package.json
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
