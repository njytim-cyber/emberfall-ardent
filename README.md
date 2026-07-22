# 🌆 EMBERFALL — City of Ardent

A browser action-RPG built with **Three.js** (WebGL), no build step. You play
**Cade**, an operative for the resistance cell *Emberfall*, fighting down
**Vance Avenue** through Helix Corp security to take down **President Vance**.

**▶ Play it:** open the GitHub Pages link for this repo (Settings → Pages), or
run locally (below). Works on desktop **and** touch devices (phones/tablets).

---

## 🎮 Controls

**Desktop**
| Input | Action |
|-------|--------|
| **W A S D** | Move · **Mouse** look · **Shift** sprint |
| **Left Click / Space** | Melee |
| **, . /** | Fire equipped blade-arts |
| **Right Click** | Lock on / off |
| **R** | Limit Break (when the gauge is full) |
| **Ctrl / Q** | Dash |
| **E** | Trade with Doc · **C** Abilities & gear · **Esc** release mouse |

**Mobile / tablet** — on-screen controls appear automatically: left **joystick**
to move, **drag anywhere** to look, and buttons for attack, the three abilities,
dash, lock-on and Limit Break.

---

## ⚔️ Features
- Real-time combat down a single detailed **daytime city street**, 3 story
  **chapters** with cutscenes, ending in the **President Vance** boss fight.
- **Blade-arts** abilities (Braver, Cross-Slash, Blade Beam, Omnislash…) with
  cast VFX, plus a **Limit Break** ("Omni-Surge") that charges by hitting drones.
- **Lock-on** targeting, **dash**, enemy **laser** attacks, floating enemy
  health bars, a **shop** (Doc), gear (Iron Blade / Combat Vest), and leveling.
- Distinct enemy models: humanoid security, hovering **drones**, walking **mechs**.

---

## 🖥️ Run locally
Browsers block ES-module imports over `file://`, so serve the folder:
```bash
python -m http.server 8000
# then open http://localhost:8000
```
> Requires internet on first load — Three.js is pulled from a CDN.

---

## 📁 Structure
`src/core` (Game loop, Input, Director), `src/world` (Environment, Town/street),
`src/entities` (Player, Enemy, Projectile, NPC), `src/systems` (Combat),
`src/story` (Story, Cutscene), `src/ui` (HUD, Menu, Shop, MobileControls),
`src/data` (config, spells, story text).
