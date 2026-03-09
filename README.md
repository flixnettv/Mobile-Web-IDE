# Mobile Web IDE

A production-ready, mobile-friendly Web IDE with a built-in backend for file management and code execution.

## Features

- **Monaco Editor**: High-performance code editor with syntax highlighting.
- **File Explorer**: Create, read, update, and delete files.
- **Code Execution**: Run JavaScript code directly in the browser.
- **Mobile Friendly**: Responsive design optimized for phones and tablets.
- **Android Wrapper**: Native Kotlin wrapper for mobile app deployment.
- **Docker Support**: Containerized for easy deployment.

## Project Structure

- `backend/`: Express server logic (integrated in `server.ts`).
- `web/`: React/Vite frontend (integrated in `src/`).
- `android/`: Native Android application source.
- `docker/`: Dockerfile for containerization.
- `scripts/`: Build and setup scripts.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:
```bash
npm run dev
```
The IDE will be available at `http://localhost:3000`.

### Docker Deployment

Build and run the Docker container:
```bash
docker build -t webide -f docker/Dockerfile .
docker run -p 3000:3000 webide
```

### Android Build (via Google Colab)

1. Upload the project to Google Colab.
2. Run the setup script:
   ```bash
   bash scripts/setup-colab.sh
   ```
3. Build the APK:
   ```bash
   bash scripts/build-apk.sh
   ```

## License

Apache-2.0
