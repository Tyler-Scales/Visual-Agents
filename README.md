# Visual Agents

A desktop app that turns your running Claude Code and Claude Desktop sessions into animated pixel-art characters working in a shared office.

Each active AI session gets its own character. When the agent edits files, the character types at a desk. When it reads or searches, the character reads. When it runs commands, waits for input or finishes a task, the character shows that too. You can see what every agent is doing without switching between terminal windows.

## How it works

```
~/.claude/projects/*.jsonl  ──►  JsonlWatcher  ──►  ActivityDetector  ──►  IPC  ──►  Character state machine
Claude Desktop session meta ──►  SessionManager                                      (walk · type · read · think · wait · celebrate)
```

- **Session discovery.** Finds active Claude Code sessions from their JSONL transcripts and Claude Desktop sessions from the app's session metadata. A session counts as active if it changed in the last 5 minutes.
- **Live activity detection.** Watches transcripts with `chokidar` and maps each tool call to a visual activity: `Edit`/`Write` → writing, `Read`/`Grep` → reading, `Bash` → running, `AskUserQuestion` → waiting. Subagents get their own characters.
- **Game engine.** A custom canvas renderer with a fixed-step game loop, tile grid, A* pathfinding, camera, particle effects and a day/night cycle.
- **Office editor.** Rearrange the office layout and decorations. Layouts are saved between runs.
- **Extras.** A tray icon, desktop notifications when an agent needs input, an activity timeline, per-session stats, achievements, a minimap and sound effects.

## Tech stack

**Electron 33** · **React 19** · **TypeScript** · **electron-vite** · **Vitest** · **chokidar**

```
src/
  main/       # Electron main process: discovery, file watchers, IPC, tray, notifications, stats
  preload/    # Context-isolated bridge between main and renderer
  renderer/   # React UI and the canvas game engine (engine/, characters/, office/, editor/, ui/)
  shared/     # Types shared by both processes
```

## Run it

```bash
npm install
npm run dev        # launch with hot reload
npm test           # run the unit tests (grid, pathfinding, activity detection)
npm run build      # production build
```

Requires macOS (it reads Claude Desktop's session data from `~/Library/Application Support/Claude`) and Node 20+.
