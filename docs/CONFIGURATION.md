# Configuration

Customization options for the RPSLS Simulation.

All settings are located in `script.js` within the `CONFIG` and `COLORS` objects.

## Simulation Physics

| Setting                  | Default | Description                                       |
| ------------------------ | ------- | ------------------------------------------------- |
| `FPS`                    | 60      | Frames per second                                 |
| `ENTITY_RADIUS`          | 30      | Size of each entity                               |
| `TARGET_SPEED`           | 1.2     | Minimum movement speed                            |
| `MAX_SPEED`              | 2.4     | Maximum movement speed                            |
| `MAX_AGE_SECONDS`        | 60      | Entity lifespan                                   |
| `HITBOX_RADIUS`          | 0.64    | Collision detection radius (64% of entity radius) |
| `DAMAGE_COOLDOWN_FRAMES` | 120     | Frames between damage (2s at 60 FPS)              |
| `MAX_ATTRACT_DIST`       | 150     | Maximum distance for group attraction             |

## Group Dynamics

| Setting          | Default | Description                             |
| ---------------- | ------- | --------------------------------------- |
| `MAX_GROUP_SIZE` | 7       | Maximum entities per group before split |

## UI Settings

| Setting                 | Default | Description                              |
| ----------------------- | ------- | ---------------------------------------- |
| `STATS_UPDATE_INTERVAL` | 15      | Frames between stats updates (4×/second) |
| `GRAPH_UPDATE_INTERVAL` | 15      | Frames between graph updates (4×/second) |
| `TIME_WINDOW_SECONDS`   | 60      | Graph history window                     |

## Graph Settings

| Setting               | Default | Description            |
| --------------------- | ------- | ---------------------- |
| `GRAPH_DEFAULT_MAX_Y` | 30      | Default Y-axis maximum |
| `GRAPH_GLOW_BLUR`     | 6       | Glow effect intensity  |

## Responsive Design

| Setting                       | Default | Description                         |
| ----------------------------- | ------- | ----------------------------------- |
| `MOBILE_BREAKPOINT`           | 768     | Pixel width for mobile layout       |
| `VERY_SMALL_BREAKPOINT`       | 480     | Pixel width for very small screens  |
| `GRAPH_MOBILE_HEIGHT_PCT`     | 0.25    | Graph height on mobile (25%)        |
| `GRAPH_VERY_SMALL_HEIGHT_PCT` | 0.20    | Graph height on small screens (20%) |
| `STATS_MOBILE_WIDTH_PCT`      | 0.9     | Stats width on mobile (90%)         |

### Font & Icon Sizes

| Setting             | Desktop | Mobile |
| ------------------- | ------- | ------ |
| `FONT_DESKTOP_SIZE` | 10      | -      |
| `FONT_MOBILE_SIZE`  | -       | 12     |
| `ICON_DESKTOP_SIZE` | 14      | -      |
| `ICON_MOBILE_SIZE`  | -       | 18     |

## Visual Effects

| Setting          | Default | Description                 |
| ---------------- | ------- | --------------------------- |
| `PARTICLE_LIMIT` | 300     | Maximum particles on screen |

## Z-Index Layers

| Setting              | Default | Description           |
| -------------------- | ------- | --------------------- |
| `UI_Z_INDEX`         | 2       | Graph and stats layer |
| `SIMULATION_Z_INDEX` | 3       | Main entity layer     |

## Colors (`COLORS` object)

### Graph Line Colors

```javascript
GRAPH_LINE_COLORS: {
  rock: '#808080',     // Gray
  paper: '#ffffff',    // White
  scissors: '#ff0000', // Red
  lizard: '#00ff00',   // Green
  spock: '#ffff00'     // Yellow
}
```

### Health Bar Colors

| Setting             | Color  | Usage         |
| ------------------- | ------ | ------------- |
| `HEALTH_BAR_GREEN`  | Green  | >50% health   |
| `HEALTH_BAR_YELLOW` | Yellow | 25-50% health |
| `HEALTH_BAR_RED`    | Red    | <25% health   |

### UI Colors

| Setting           | Default           | Description              |
| ----------------- | ----------------- | ------------------------ |
| `AXIS_COLOR`      | `#00ff00`         | Graph axis color (green) |
| `ND_FILTER_COLOR` | `rgba(0,0,0,0.4)` | UI overlay darkening     |

## Customization Tips

### Change Entity Speed

```javascript
CONFIG.TARGET_SPEED = 2.0; // Faster minimum speed
CONFIG.MAX_SPEED = 4.0; // Faster maximum speed
```

### Longer Entity Lifespan

```javascript
CONFIG.MAX_AGE_SECONDS = 120; // 2 minutes
```

### Larger Groups

```javascript
CONFIG.MAX_GROUP_SIZE = 10; // Allow bigger groups
```

### Different Graph Time Window

```javascript
CONFIG.TIME_WINDOW_SECONDS = 120; // 2 minute history
```

### Adjust Visual Glow

```javascript
CONFIG.GRAPH_GLOW_BLUR = 10; // More intense glow
```

## Development Tips

- Use browser DevTools to experiment with values in real-time
- Test on mobile devices or browser emulation for responsive behavior
- Check console for warnings if issues occur
- Frame count available for timing debugging
