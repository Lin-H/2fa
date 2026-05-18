# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri-based two-factor authentication desktop app built with React 19 + TypeScript + Vite frontend and Rust (Tauri 2) backend.

## Development Commands

```bash
npm run start      # Run Tauri dev server (launches both frontend and backend)
npm run dev        # Run Vite frontend dev server (backend starts separately)
npm run build      # Build frontend
tauri build        # Build entire app (frontend + Rust backend)
```

## Architecture

**Frontend:** React 19 + TypeScript + Vite. Uses `wouter` for simple path-based routing (`/` for main authenticator view, `/setting` for settings). All frontend code lives in `src/`.

**Backend:** Rust with Tauri 2. Main entry point is `src-tauri/src/main.rs`. Commands are exposed via `#[tauri::command]` and invoked from frontend using `invoke()`.

**Routing:** Uses wouter's `Switch` and `Route` components. The app has a single-layer navigation structure: main view (`/`) and settings page (`/setting`).

**Assets:** SVG assets live in `src/assets/` and are imported using `@/` path alias. SCSS modules are used for styling.

**Capabilities:** Tauri 2 permissions are configured in `src-tauri/capabilities/`. Currently uses `core:default`.

## Path Alias

The project uses `@/` as an alias for `./src/` (configured in `tsconfig.json` and `vite.config.ts`).
