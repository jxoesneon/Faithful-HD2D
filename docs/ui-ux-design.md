# UI & UX Design Language

The HUD (Heads-Up Display) in Faithful sits at the paradoxical intersection of an "Omnipotent God Game" and a "Terminal OS interface."

## Visual Language

- **Theme**: "Divine OS". Utilitarian, sleek, data-heavy, but accented with ethereal, supernatural glows.
- **Typography**:
  - Monospace (e.g., `JetBrains Mono`) for raw data feeds, coordinates, system metrics.
  - Clean Sans-Serif (e.g., `Inter` or `Outfit`) for human-readable concepts, society names, and major labels.
- **Materials**: Deep black panels with high blur/frosted glass backing (`backdrop-blur`). Minimal opaque borders (thin 1px lines at 10% opacity).

## Interaction Layers (L0-L4)

### Macro Overlay (L0/L1 View)

- When zoomed out, the UI shifts from tactical interaction to data visualization.
- **Heatmaps**: Toggleable overlay modes.
  - _Devotion Map_: Glow intensity representing faith hot-spots.
  - _Resource Map_: Color-coded indicators for untouched biomass vs heavily industrialized zones.
- **Global Actions**: Miracles executed here affect massive areas but cost 10x the Devotion.

### Tactical Overlay (L2/L3 View)

- **The Divine Cursor**: Context-aware. Hovering over a tile highlights it and its contiguous neighbors. Hovering over an L3 actor spawns a micro-tooltip with their current thought or job (e.g., `"Gathering Wood"`, `"Praying for Rain"`).
- **Intervention Palette**: A minimalist dock (typically on the left or bottom) containing selectable Miracles. Selecting one primes the cursor.
- **Dimensional Rift Feed (Log)**: A constantly scrolling, terminal-style log of significant global events (Schisms, Evolutions, Catastrophes), providing the player with narrative texture even in areas they aren't looking at.

## Modal & Detail Views

- **Focus Mode**: When clicking a specific society, the main simulation is dimmed, and a crisp, bold overlay appears detailing their specific Belief Matrix, Tech Level, and current needs.
- **Schism Alerts**: When two Faiths clash, the UI forces a non-modal prompt (a glowing notification in the periphery) that the player can click to jump the camera instantly to the front lines.
