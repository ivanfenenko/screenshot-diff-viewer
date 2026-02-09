# Paparazzi Compare - Usage Guide

## Getting Started

### Running the Application

To start the application in development mode:

```bash
cd paparazzi-compare
npm run tauri dev
```

### Building for Production

To create a production build:

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Using the Application

### 1. Opening a Repository

1. Launch the application
2. You'll see the welcome screen with "Open Repository" button
3. Click the button and navigate to your Git repository containing Paparazzi screenshots
4. The app will validate it's a Git repository and scan for screenshots

### 2. Viewing Screenshots

Once a repository is loaded:

- **Left Sidebar**: Lists all found screenshots
- **Search Bar**: Filter screenshots by name
- **Click any screenshot**: View it in the main area

### 3. Comparing Screenshots

To compare screenshots across different Git refs:

1. Click the **"Compare with..."** button in the top-right
2. Choose from three options:
   - **Branches Tab**: Select any local branch
   - **Tags Tab**: Select any Git tag
   - **Commit Tab**: Enter a specific commit hash
3. The view will switch to side-by-side comparison:
   - Left: Current branch version
   - Right: Selected ref version

### 4. Navigation

- **Arrow Keys**: Navigate between screenshots (coming soon)
- **ESC Key**: Exit comparison mode (coming soon)
- **Search**: Use the search bar to filter screenshots

### 5. Git LFS Support

The application automatically handles Git LFS files:

- When comparing, it detects if a file is an LFS pointer
- Automatically fetches the actual file if needed
- Shows a loading indicator during fetch
- Caches fetched files for the session

## Tips

- Screenshots are auto-detected in common directories:
  - `**/snapshots/**`
  - `**/screenshots/**`
  - `**/__snapshots__/**`

- The app shows the current branch in the top bar

- You can change repositories at any time by clicking "Change Repository"

## Troubleshooting

### "Not a Git repository" error
- Ensure you selected the root directory of a Git repository (contains `.git` folder)

### "No screenshots found"
- Verify your screenshots are in PNG format
- Check they're in standard snapshot directories
- The app searches up to 6 levels deep

### Git LFS files not loading
- Ensure Git LFS is installed: `git lfs version`
- Check your LFS configuration: `git lfs env`
- Verify you have network access to fetch LFS objects

### Build errors
- Make sure all dependencies are installed: `npm install`
- Ensure Rust and Cargo are properly installed
- Check that Git is available in your system PATH

## Keyboard Shortcuts (Planned)

- `←/→`: Previous/Next screenshot
- `ESC`: Exit comparison mode
- `Cmd/Ctrl + O`: Open repository
- `Cmd/Ctrl + F`: Focus search

## System Requirements

- **macOS**: 10.13 or later
- **Windows**: Windows 10 or later
- **Linux**: Most modern distributions with GTK 3.24+

## Performance Notes

- First scan may take a few seconds for large repositories
- LFS files are cached after first fetch
- Comparing large images may take a moment to load
