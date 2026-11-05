# SHREDR Mobile - PWA Prototype

A small React + Typescript + Tailwind CSS + Vite PWA

## Start
1. Open a terminal in the folder and run:
```bash
npm install
npm run dev
``` 
2. Open the local URL printed by Vite (`http://localhost:5173`
5. For DevTools, change the device toolbar to preview phone layouts.

## What works 
- Home dashboard with placeholder data and activity chart
- Scan Screen: search and select a fictional executable
- Click **View simulated analysis result** to open a fictional classification.
- History screen: search, filter, open a previous result.
- Settings screen: planned backend integration
- Responsive design and PWA manifest/icons.

## What is not provided yet
- No real analysis, file reading, uploading, model inference, backend, database or authentication.
- No claim is made that any executable is safe or malicious
- All executable names, scores, dates and classification are fictional

## Later Integration
To replace the simulated scan action in `src/App.tsx` with an authenticated requets to a FastAPI endpoint which accepts a fixed, allowlisted sample ID, invokes the existing static feature extractor and XGBoost model on the laptop and returns a real result. 

## Build
```bash
npm run build
npm run preview
```
