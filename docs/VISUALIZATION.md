# Visualization

UI, graph, and visual effects documentation for the RPSLS Simulation.

## Real-time Statistics Panel

### Position

- **Desktop:** Top-right corner
- **Mobile:** Bottom-center

### Content

- Current count for each entity type
- Average health percentage with emoji symbols
- Updates 4×/second (`CONFIG.STATS_UPDATE_INTERVAL = 15` frames)

### Health Visualization

Dynamic health bars with color coding:

- **Green:** >50% health
- **Yellow:** 25-50% health
- **Red:** <25% health

## Oscilloscope-style Graph

### Position

- **Desktop:** Top-left corner
- **Mobile:** Full-width top

### Features

- Population trends over 60-second window
- Glowing traces with blur effect
- Current value icons at trace heights
- Minimal green axes
- "1 min window" time label

### Trace Colors

| Entity      | Color  | Hex       |
| ----------- | ------ | --------- |
| 🪨 Rock     | Gray   | `#808080` |
| 📄 Paper    | White  | `#ffffff` |
| ✂️ Scissors | Red    | `#ff0000` |
| 🦎 Lizard   | Green  | `#00ff00` |
| 🖖 Spock    | Yellow | `#ffff00` |

### Data

- **Metric:** Adjusted count (count × average health)
- **Update Rate:** 4×/second
- **Y-scale:** Dynamic from data min/max or default max 30

## Visual Effects

### Particle System

- Configurable limit (`CONFIG.PARTICLE_LIMIT = 300`)
- Performance optimized

### Collision Sparks

- Colorful spark particles fly outward on collision
- Uses mix of both entity group colors

### Conversion Rings

- Expanding ring effect when prey converts to hunter type
- Color transition from original to new group color

### Death Effects

- Implosion particles converging toward center
- Dramatic disappearance effect

### Spawn Effects

- Burst particles expanding outward
- Announces entity arrival

### Motion Trails

- Fading trail behind each moving entity
- 5 positions with exponential fade
- Uses group colors

### Group Connection Lines

- Tractor beam visualization between same-group entities
- Lines appear between minimum and maximum attraction distance
- Fixed opacity 0.6
- Thickness scales inversely with distance
- Drawn behind entities for proper layering

## Layering System

| Layer       | Z-Index | Content       |
| ----------- | ------- | ------------- |
| Source Link | 4       | GitHub link   |
| Simulation  | 3       | Main entities |
| UI          | 2       | Graph, stats  |

## ND-Filter Overlay

- **Effect:** Semi-transparent darkening `rgba(0,0,0,0.4)`
- **Purpose:** Reduces UI prominence
- **Applied to:** Graph and stats panel

## High-DPI Support

- devicePixelRatio applied to all canvas dimensions
- `ctx.scale(dpr, dpr)` for crisp rendering
- Sharp on Retina/4K displays

## Responsive Design

### Breakpoints

- **Mobile:** 768px (`CONFIG.MOBILE_BREAKPOINT`)
- **Very Small:** 480px (`CONFIG.VERY_SMALL_BREAKPOINT`)

### Mobile Adaptations

- Graph height percentages: 25% (mobile), 20% (very small)
- Stats width: 90%
- Scaled fonts and icons
- Repositioned UI elements

## Color Scheme

### Entity Groups

- HSL-based rainbow colors
- Color determined by group ID
- Consistent across all visual effects

### Health Bars

- Green → Orange → Red gradient
- Based on remaining health ratio

### UI Elements

- Monochrome with green accents
- Oscilloscope aesthetic
