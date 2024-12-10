# Gaussian Splatting Viewer

A web-based viewer for Gaussian Splatting models using WebGL.

## Quick Start

### Installation & Running

1. Clone this repository to your local machine:
   ```bash
   git clone [repository-url]
   cd [repository-name]
   ```

2. Start a local server:
   ```bash
   python -m http.server 8000
   ```

3. Access the viewer:
   - Open a web browser in private/incognito mode
   - Navigate to: `http://localhost:8000`

> Note: Using private/incognito mode helps avoid caching issues during development.


## Technical Details

### Key Features
- WebGL-based rendering
- Orbit controls for model manipulation
- Progress indicator for model loading
- Auto-rotation when idle
- Responsive design


## Usage Tips

1. **Navigation:**
   - Left mouse: Rotate the view
   - Right mouse: Pan
   - Scroll wheel: Zoom in/out

2. **Performance:**
   - Models automatically start rotating when idle
   - Loading progress is shown during model initialization

## Development

To modify the viewer:
1. Make your changes to the source files
2. Refresh the browser page to see updates
3. No build process required

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

CC

---
For more information, please refer to the documentation or open an issue.