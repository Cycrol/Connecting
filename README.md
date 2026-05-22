# Connecting

A small polished browser-based emotional puzzle game built with Phaser 3, Matter.js, TypeScript, and Vite.

## Project Structure

- `index.html`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `.gitignore`
- `src/`
  - `main.ts`
  - `vite-env.d.ts`
  - `scenes/MainScene.ts`
  - `levels/Chapter1Scene.ts`
  - `entities/BlobPerson.ts`
  - `systems/ConnectionSystem.ts`
  - `physics/MatterHelpers.ts`
  - `audio/AudioManager.ts`

## Run Locally

From the project folder:

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:4173/`).

## Build for production

```bash
npm run build
```

Then preview the optimized build with:

```bash
npm run preview
```

## Notes

- The game is designed to run with Vite and should not be opened through a static server that serves raw TypeScript files.
- All visuals are procedurally drawn with Phaser Graphics.
- Ambient audio is generated procedurally with the browser Web Audio API.
