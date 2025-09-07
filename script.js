/**
 * @constant CONFIG
 * @description Central configuration object for simulation parameters, UI settings, and responsive breakpoints.
 * All magic numbers have been centralized here for easier maintenance and adjustment.
 */
const CONFIG = {
  // Simulation constants - Entity behavior and physics parameters
  ENTITY_RADIUS: 30, // Visual radius of entities in pixels
  HITBOX_RADIUS: 30 * 0.64, // Collision detection radius (64% of visual radius)
  INITIAL_ENTITY_COUNT: 30, // Number of entities to spawn initially
  MAX_AGE_SECONDS: 60, // Maximum lifespan of an entity in seconds
  FPS: 60, // Target frames per second for simulation
  DAMAGE_COOLDOWN_FRAMES: 120, // Frames between damage applications (2 seconds at 60 FPS)
  INITIAL_SPEED: 2, // Starting speed magnitude for new entities
  MAX_SPEED: 2 * 1.2, // Maximum allowed speed (120% of target speed)
  TARGET_SPEED: 2, // Desired speed for entities
  SPEED_ADJUST_FACTOR: 0.02, // Incremental speed adjustment per frame
  MAX_ATTRACT_DIST: 10 * (30 * 0.64), // Maximum distance for attraction forces
  ALIGN_RADIUS: 10 * (30 * 0.64), // Radius for alignment behavior within groups
  ALIGN_FACTOR: 0.05, // Strength of alignment force
  EDGE_MARGIN: 100, // Distance from canvas edge to apply edge forces
  EDGE_FORCE: 0.05, // Strength of edge repulsion force

  // UI and visualization - Graph, stats, and rendering settings
  STATS_UPDATE_INTERVAL: 15, // Update stats every 15 frames (4 times per second at 60 FPS)
  GRAPH_UPDATE_INTERVAL: 15, // Update graph data every 15 frames (4 times per second)
  TIME_WINDOW_SECONDS: 60, // Time window for graph history (1 minute)
  GRAPH_DEFAULT_MAX_Y: 30, // Default maximum Y value for graph scaling when no data exists
  GRAPH_GLOW_BLUR: 6, // Blur radius for glowing line effects in graph
  ND_FILTER_OPACITY: 0.4, // Opacity for ND-filter overlay effect

  // Responsive breakpoints and percentages - Mobile and desktop layout settings
  MOBILE_BREAKPOINT: 768, // Screen width threshold for mobile layout (pixels)
  VERY_SMALL_BREAKPOINT: 480, // Screen width threshold for very small screens
  GRAPH_MOBILE_HEIGHT_PCT: 0.25, // Graph height as percentage of viewport on mobile
  GRAPH_VERY_SMALL_HEIGHT_PCT: 0.20, // Graph height percentage for very small screens
  GRAPH_DESKTOP_HEIGHT_PCT: 0.33, // Graph height percentage for desktop
  STATS_MOBILE_HEIGHT_PCT: 0.25, // Stats panel height percentage on mobile
  STATS_MOBILE_WIDTH_PCT: 0.9, // Stats panel width percentage on mobile
  GRAPH_MOBILE_WIDTH_PCT: 0.95, // Graph width percentage on mobile

  // Z-index layering - Canvas stacking order
  SIMULATION_Z_INDEX: 3, // Z-index for main simulation canvas
  UI_Z_INDEX: 2, // Z-index for UI elements (stats, graph)
  LINK_Z_INDEX: 4, // Z-index for source code link

  // Icon and font scaling - Responsive sizing for text and symbols
  ICON_MOBILE_SIZE: 18, // Icon size on mobile devices
  ICON_VERY_SMALL_SIZE: 14, // Icon size on very small screens
  ICON_DESKTOP_SIZE: 16, // Icon size on desktop
  FONT_MOBILE_SIZE: 12, // Font size for graph labels on mobile
  FONT_VERY_SMALL_SIZE: 10, // Font size for very small screens
  FONT_DESKTOP_SIZE: 10, // Font size for desktop
  STATS_TITLE_FONT_SIZE_ADD: 2 // Additional size for stats title font
};

/**
 * @constant COLORS
 * @description Centralized color configuration for all UI elements.
 * All colors are defined here for consistent theming and easy maintenance.
 * RPSLS entity colors follow traditional color associations.
 */
const COLORS = {
  // Graph line colors for each RPSLS entity type (oscilloscope-style traces)
  GRAPH_LINE_COLORS: {
    rock: '#808080',      // Gray - represents stone/rock
    paper: '#ffffff',     // White - represents paper sheet
    scissors: '#ff0000',  // Red - represents sharp metal blades
    lizard: '#00ff00',    // Green - represents reptilian creature
    spock: '#ffff00'      // Yellow - represents Vulcan salute
  },
  // Axis color for oscilloscope-style graph (classic green CRT display)
  AXIS_COLOR: '#00ff00',
  // ND-filter overlay for subtle UI darkening effect
  ND_FILTER_COLOR: 'rgba(0, 0, 0, 0.4)',
  // Health bar colors for entity lifespan visualization
  HEALTH_BAR_BACKGROUND: 'rgba(255,255,255,0.5)', // Semi-transparent white outline
  HEALTH_BAR_GREEN: 'rgba(0,255,0,0.5)', // Green for healthy entities (>50% life)
  HEALTH_BAR_YELLOW: 'rgba(255,255,0,0.5)', // Yellow for warning state (25-50% life)
  HEALTH_BAR_RED: 'rgba(255,0,0,0.5)', // Red for critical state (<25% life)
  // Stats panel text colors
  STATS_TEXT: 'white', // Default text color for statistics
  STATS_TITLE: 'white' // Title color for stats panel
};

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
canvas.style.zIndex = `${CONFIG.SIMULATION_Z_INDEX}`;
const statsCanvas = document.getElementById('statsCanvas');
const statsCtx = statsCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

let lastGraphUpdateFrame = 0;


function resizeSimulationCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
}

function resizeUI(currentTime, frameCount) {
  if (typeof frameCount === 'undefined') return; // Skip during initialization

  const dpr = window.devicePixelRatio || 1;

  // Resize graph canvas using responsive dimensions
  const { baseWidth: graphBaseWidth, baseHeight: graphBaseHeight } = calculateDimensions(currentTime);
  graphCanvas.width = graphBaseWidth * dpr;
  graphCanvas.height = graphBaseHeight * dpr;
  graphCtx.scale(dpr, dpr);

  // Resize stats canvas using responsive logic
  const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
  const statsWidth = isMobile ? window.innerWidth * CONFIG.STATS_MOBILE_WIDTH_PCT : 250;
  const statsHeight = isMobile ? window.innerHeight * CONFIG.STATS_MOBILE_HEIGHT_PCT : 200;
  statsCanvas.width = statsWidth * dpr;
  statsCanvas.height = statsHeight * dpr;
  statsCtx.scale(dpr, dpr);

  // Clear UI canvases after resize
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  statsCtx.clearRect(0, 0, statsCanvas.width, statsCanvas.height);

  // Force UI update to reposition elements
  updateUI(currentTime);
  drawGraph(currentTime);
}

function resizeCanvas() {
  const currentTime = typeof frameCount !== 'undefined' ? frameCount / CONFIG.FPS : 0;

  // Always resize simulation canvas
  resizeSimulationCanvas();

  // Only resize UI after initialization
  if (typeof frameCount !== 'undefined') {
    resizeUI(currentTime, frameCount);
  }
}
window.addEventListener('resize', resizeCanvas);
resizeSimulationCanvas(); // Initial call - only simulation canvas

const MAX_AGE_FRAMES = CONFIG.MAX_AGE_SECONDS * CONFIG.FPS;

let nextGroupId = 1;
let frameCount = 0;

const TYPES = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
const SYMBOLS = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
  lizard: '🦎',
  spock: '🖖'
};

const beats = {
  rock: ['scissors', 'lizard'],
  paper: ['rock', 'spock'],
  scissors: ['paper', 'lizard'],
  lizard: ['paper', 'spock'],
  spock: ['scissors', 'rock']
};

function groupColor(groupId) {
  const hue = (groupId * 137) % 360;
  return `hsl(${hue}, 80%, 50%)`;
}

/**
 * @class Entity
 * @description Represents a single RPSLS entity with position, velocity, type, and group affiliation.
 * Entities exhibit flocking behavior (alignment, attraction, repulsion) and follow RPSLS interaction rules.
 * Each entity has a lifespan represented by age, with visual health bars and group-based coloring.
 *
 * @property {number} x - Current X position on canvas
 * @property {number} y - Current Y position on canvas
 * @property {number} vx - X component of velocity
 * @property {number} vy - Y component of velocity
 * @property {string} type - Entity type: 'rock', 'paper', 'scissors', 'lizard', or 'spock'
 * @property {number} groupId - Unique identifier for the entity's group (same-type entities)
 * @property {number} age - Current age in frames (increases until maxAge)
 * @property {number} maxAge - Maximum lifespan in frames (CONFIG.MAX_AGE_SECONDS * CONFIG.FPS)
 * @property {number} lastDamageFrame - Last frame this entity took damage
 *
 * @example
 * const entity = new Entity(100, 100, 1, 0, 'rock', 1);
 * entity.update(); // Updates position, velocity, and age
 * entity.draw(ctx); // Renders entity with glow, symbol, and health bar
 */
class Entity {
  /**
   * @constructor
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {number} vx - Initial X velocity
   * @param {number} vy - Initial Y velocity
   * @param {string} type - RPSLS type ('rock', 'paper', 'scissors', 'lizard', 'spock')
   * @param {number} groupId - Group identifier for same-type entities
   */
  constructor(x, y, vx, vy, type, groupId) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.groupId = groupId;
    this.age = 0;
    this.maxAge = MAX_AGE_FRAMES;
    this.lastDamageFrame = -Infinity;
  }

  /**
   * @method update
   * @description Updates entity position, velocity, and age with bounds checking and speed validation.
   * Applies edge forces, maintains target speed range, and clamps position within canvas boundaries.
   * Includes input validation to prevent invalid states (negative age, excessive speeds).
   */
  update() {
    // Validate and update position with bounds checking
    this.x = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.width - CONFIG.ENTITY_RADIUS, this.x + this.vx));
    this.y = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.height - CONFIG.ENTITY_RADIUS, this.y + this.vy));

    // Apply edge forces with speed limits
    if (this.x < CONFIG.EDGE_MARGIN) this.vx = Math.min(this.vx + CONFIG.EDGE_FORCE, CONFIG.MAX_SPEED);
    else if (this.x > canvas.width - CONFIG.EDGE_MARGIN) this.vx = Math.max(this.vx - CONFIG.EDGE_FORCE, -CONFIG.MAX_SPEED);
    if (this.y < CONFIG.EDGE_MARGIN) this.vy = Math.min(this.vy + CONFIG.EDGE_FORCE, CONFIG.MAX_SPEED);
    else if (this.y > canvas.height - CONFIG.EDGE_MARGIN) this.vy = Math.max(this.vy - CONFIG.EDGE_FORCE, -CONFIG.MAX_SPEED);

    // Final strict bounds clamping
    this.x = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.width - CONFIG.ENTITY_RADIUS, this.x));
    this.y = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.height - CONFIG.ENTITY_RADIUS, this.y));

    // Validate and adjust speed within acceptable range
    let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    speed = Math.max(0, speed); // Ensure non-negative speed

    if (speed < CONFIG.TARGET_SPEED) {
      // Gradually accelerate towards target speed
      const scale = 1 + CONFIG.SPEED_ADJUST_FACTOR;
      this.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, this.vx * scale));
      this.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, this.vy * scale));
    } else if (speed > CONFIG.MAX_SPEED) {
      // Cap speed at maximum allowed value
      const scale = CONFIG.MAX_SPEED / speed;
      this.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, this.vx * scale));
      this.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, this.vy * scale));
    }

    // Increment and clamp age within valid range
    this.age = Math.max(0, Math.min(this.age + 1, this.maxAge));
  }

  /**
   * @method draw
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context for rendering
   * @description Renders the entity with group-colored glow, RPSLS symbol, and health bar.
   * Health bar color changes based on remaining lifespan (green/yellow/red).
   * Includes validation for health ratio to prevent rendering artifacts.
   */
  draw(ctx) {
    // Validate health ratio (0-1 range)
    const healthRatio = Math.max(0, Math.min(1, (this.maxAge - this.age) / this.maxAge));

    // Draw group-colored glow effect
    ctx.save();
    const hue = (this.groupId * 137) % 360; // Golden angle for distinct group colors
    ctx.shadowColor = `hsla(${hue}, 80%, 50%, 0.5)`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.2)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, CONFIG.HITBOX_RADIUS + 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw main entity symbol
    ctx.globalAlpha = 1.0;
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SYMBOLS[this.type], this.x, this.y);

    // Draw health bar above entity
    ctx.save();
    const barWidth = 40;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y - CONFIG.ENTITY_RADIUS - 4;

    // Select health bar color based on remaining life
    let healthColor;
    if (healthRatio > 0.5) {
      healthColor = COLORS.HEALTH_BAR_GREEN; // Healthy
    } else if (healthRatio > 0.25) {
      healthColor = COLORS.HEALTH_BAR_YELLOW; // Warning
    } else {
      healthColor = COLORS.HEALTH_BAR_RED; // Critical
    }

    // Draw health bar fill (proportional to remaining life)
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

    // Draw health bar outline
    ctx.strokeStyle = COLORS.HEALTH_BAR_BACKGROUND;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.restore();
  }

  /**
   * @method resetAge
   * @description Resets the entity's age to 0, effectively giving it full health/lifespan.
   * Used when entities are converted between types or groups during interactions.
   */
  resetAge() {
    this.age = 0;
  }

  /**
   * @method isDead
   * @returns {boolean} True if entity has reached maximum age (lifespan expired)
   * @description Checks if the entity should be replaced with a new spawn.
   */
  isDead() {
    return this.age >= this.maxAge;
  }
}

let typeHistory = {};
for (const type of TYPES) {
  typeHistory[type] = [];
}

/**
 * @function computeStats
 * @returns {Object} Statistics object with count and average health for each RPSLS type
 * @description Calculates current population statistics for all entity types.
 * Includes validation for invalid entities and clamps health values between 0-1.
 * Average health is computed as total health divided by count, with zero-division protection.
 *
 * @example
 * {
 *   rock: { count: 5, totalHealth: 3.2, avgHealth: 0.64 },
 *   paper: { count: 3, totalHealth: 1.8, avgHealth: 0.6 },
 *   // ... other types
 * }
 */
function computeStats() {
  const stats = {};
  for (const type of TYPES) {
    stats[type] = {
      count: 0,
      totalHealth: 0,
      avgHealth: 0 // Initialize to prevent undefined access
    };
  }

  // Aggregate health data from all valid entities
  for (const entity of entities) {
    if (!entity || entity.age < 0 || entity.maxAge <= 0) continue;
    const health = Math.max(0, Math.min(1, (entity.maxAge - entity.age) / entity.maxAge));
    stats[entity.type].count = Math.max(0, stats[entity.type].count + 1);
    stats[entity.type].totalHealth = Math.max(0, stats[entity.type].totalHealth + health);
  }

  // Calculate average health for each type with validation
  for (const type of TYPES) {
    if (stats[type].count > 0) {
      stats[type].avgHealth = Math.max(0, Math.min(1, stats[type].totalHealth / stats[type].count));
    } else {
      stats[type].avgHealth = 0;
    }
  }

  return stats;
}

/**
 * @function updateGraphHistory
 * @param {Object} stats - Statistics object from computeStats()
 * @param {number} currentTime - Current simulation time in seconds
 * @description Updates the time-series history for graph visualization.
 * Calculates adjusted population (count * avgHealth) for each type and adds timestamped data points.
 * Maintains a sliding window of CONFIG.TIME_WINDOW_SECONDS duration by removing old data.
 * Includes error handling for invalid stats or data corruption.
 *
 * @throws {Error} Logs warning if data processing fails
 */
function updateGraphHistory(stats, currentTime) {
  try {
    // Validate input parameters
    if (!stats || typeof currentTime !== 'number' || currentTime < 0) {
      console.warn('Invalid parameters for updateGraphHistory');
      return;
    }

    // Calculate adjusted count (population weighted by average health) for each type
    for (const type of TYPES) {
      const adjustedCount = Math.max(0, stats[type].count * stats[type].avgHealth);

      // Add new data point with timestamp to history array
      typeHistory[type].push({
        time: currentTime,
        value: adjustedCount
      });

      // Maintain sliding window: remove data points older than time window
      while (typeHistory[type].length > 0 &&
             currentTime - typeHistory[type][0].time > CONFIG.TIME_WINDOW_SECONDS) {
        typeHistory[type].shift();
      }
    }
  } catch (error) {
    console.warn('Error updating graph history:', error);
  }
}

/**
 * @function drawGraph
 * @param {number} currentTime - Current simulation time in seconds
 * @description Renders the oscilloscope-style graph showing adjusted population trends over time.
 * Calculates responsive dimensions, draws axes, traces for each type, current value icons,
 * time label, and applies ND-filter overlay. Includes comprehensive error handling.
 *
 * @throws {Error} Logs warning if rendering fails due to context or data issues
 */
/**
 * @function drawGraph
 * @param {number} currentTime - Current simulation time in seconds
 * @description Renders the oscilloscope-style graph showing adjusted population trends over time.
 * Calculates responsive dimensions, draws axes, traces for each type, current value icons,
 * time label, and applies ND-filter overlay. Includes comprehensive error handling.
 *
 * @throws {Error} Logs warning if rendering fails due to context or data issues
 */
function drawGraph(currentTime) {
  if (!graphCtx) {
    console.warn('Graph context not available');
    return;
  }

  try {
    // Calculate responsive dimensions and scaling factors
    const { baseWidth, baseHeight, graphWidth, graphHeight, xStart, yStart, iconX, iconSize, fontSize, timeScale, maxY, minY, yRange, isMobile, isVerySmall } = calculateDimensions(currentTime);

    // Set canvas dimensions and positioning styles
    graphCanvas.width = baseWidth;
    graphCanvas.height = baseHeight;
    graphCanvas.style.position = 'absolute';
    graphCanvas.style.top = '10px';
    graphCanvas.style.left = isMobile ? '2.5%' : '10px';
    graphCanvas.style.background = `rgba(0,0,0,0.9)`;
    graphCanvas.style.borderRadius = isMobile ? '8px' : '4px';
    graphCanvas.style.padding = isMobile ? '5px' : '5px';
    graphCanvas.style.zIndex = `${CONFIG.UI_Z_INDEX}`;

    // Clear canvas and render graph components
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

    drawAxes(graphWidth, graphHeight, xStart, yStart);

    const lastPoints = drawTraces(graphWidth, graphHeight, xStart, yStart, timeScale, minY, yRange, maxY, currentTime, isMobile);

    drawIcons(lastPoints, iconX, iconSize);

    // Draw time window label at bottom center
    graphCtx.fillStyle = COLORS.AXIS_COLOR;
    graphCtx.font = `${fontSize}px monospace`;
    graphCtx.textAlign = 'center';
    graphCtx.fillText('1 min window', xStart + graphWidth/2, yStart + graphHeight + 15);

    applyOverlay();
  } catch (error) {
    console.warn('Error drawing graph:', error);
  }
}

/**
 * @function calculateDimensions
 * @param {number} currentTime - Current simulation time (used for responsive calculations)
 * @returns {Object} Dimension object with calculated sizes, positions, and scaling factors
 * @description Calculates responsive dimensions for the graph canvas based on viewport size.
 * Determines mobile/very small/desktop layout, computes graph area dimensions, time scaling,
 * and Y-axis scaling based on historical data. Ensures yRange is always positive.
 *
 * @property {number} baseWidth - Base width of graph canvas
 * @property {number} baseHeight - Base height of graph canvas
 * @property {number} graphWidth - Available width for graph plotting area
 * @property {number} graphHeight - Available height for graph plotting area
 * @property {number} xStart - X coordinate for graph origin
 * @property {number} yStart - Y coordinate for graph origin
 * @property {number} iconX - X position for current value icons
 * @property {number} iconSize - Size of current value icons
 * @property {number} fontSize - Font size for labels
 * @property {number} timeScale - Pixels per second for time axis
 * @property {number} maxY - Maximum Y value from data (or default)
 * @property {number} minY - Minimum Y value from data
 * @property {number} yRange - Validated Y scaling range (minimum 1)
 * @property {boolean} isMobile - True if viewport is mobile-sized
 * @property {boolean} isVerySmall - True if viewport is very small
 */
function calculateDimensions(currentTime) {
  // Determine responsive layout based on current viewport width
  const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
  const isVerySmall = window.innerWidth <= CONFIG.VERY_SMALL_BREAKPOINT;

  // Calculate base canvas dimensions based on device type
  const baseWidth = isMobile ? window.innerWidth * CONFIG.GRAPH_MOBILE_WIDTH_PCT : 450;
  const baseHeight = isVerySmall ? window.innerHeight * CONFIG.GRAPH_VERY_SMALL_HEIGHT_PCT :
                   isMobile ? window.innerHeight * CONFIG.GRAPH_MOBILE_HEIGHT_PCT :
                   window.innerHeight * CONFIG.GRAPH_DESKTOP_HEIGHT_PCT;

  // Calculate inner graph plotting area (subtract padding/margins)
  const graphWidth = baseWidth - (isMobile ? 20 : 70); // Less space needed on mobile
  const graphHeight = baseHeight - 40;

  // Set origin and positioning constants
  const xStart = 10;
  const yStart = 20;
  const iconX = isMobile ? xStart + graphWidth + 5 : xStart + graphWidth + 10;

  // Responsive sizing for icons and fonts
  const iconSize = isVerySmall ? CONFIG.ICON_VERY_SMALL_SIZE :
                   isMobile ? CONFIG.ICON_MOBILE_SIZE : CONFIG.ICON_DESKTOP_SIZE;
  const fontSize = isVerySmall ? CONFIG.FONT_VERY_SMALL_SIZE :
                   isMobile ? CONFIG.FONT_MOBILE_SIZE : CONFIG.FONT_DESKTOP_SIZE;

  // Fixed time scale: entire x-axis represents 1 minute of data
  const timeScale = graphWidth / CONFIG.TIME_WINDOW_SECONDS;

  // Calculate Y-axis scaling based on historical data
  let maxY = CONFIG.GRAPH_DEFAULT_MAX_Y;
  let minY = 0;

  try {
    // Attempt data-dependent scaling only after all globals are initialized
    if (typeof TYPES !== 'undefined') {
      for (const type of TYPES) {
        if (typeHistory && typeHistory[type] && typeHistory[type].length > 0) {
          const values = typeHistory[type].map(point => point ? point.value || 0 : 0);
          if (values.length > 0) {
            maxY = Math.max(maxY, ...values);
            minY = Math.min(minY, ...values);
          }
        }
      }
    }
  } catch (error) {
    // During initialization, use defaults if globals not ready
    console.warn('Skipping graph scaling during initialization:', error);
    maxY = CONFIG.GRAPH_DEFAULT_MAX_Y;
    minY = 0;
  }

  // Ensure valid Y range for scaling (prevent division by zero)
  const yRange = Math.max(1, maxY - minY);

  return {
    baseWidth,
    baseHeight,
    graphWidth,
    graphHeight,
    xStart,
    yStart,
    iconX,
    iconSize,
    fontSize,
    timeScale,
    maxY,
    minY,
    yRange,
    isMobile,
    isVerySmall
  };
}

/**
 * @function drawAxes
 * @param {number} graphWidth - Width of the graph plotting area
 * @param {number} graphHeight - Height of the graph plotting area
 * @param {number} xStart - X coordinate of graph origin
 * @param {number} yStart - Y coordinate of graph origin
 * @description Draws minimal oscilloscope-style axes (X and Y) using green CRT-style color.
 * Creates simple L-shaped axis lines without ticks or labels for clean appearance.
 */
function drawAxes(graphWidth, graphHeight, xStart, yStart) {
  // Draw simple axes (oscilloscope style - minimal)
  graphCtx.strokeStyle = COLORS.AXIS_COLOR; // Classic green CRT display color
  graphCtx.lineWidth = 1;
  graphCtx.beginPath();
  graphCtx.moveTo(xStart, yStart); // Y-axis start
  graphCtx.lineTo(xStart, yStart + graphHeight); // Y-axis end
  graphCtx.lineTo(xStart + graphWidth, yStart + graphHeight); // X-axis end
  graphCtx.stroke();
}

/**
 * @function drawTraces
 * @param {number} graphWidth - Width of graph plotting area
 * @param {number} graphHeight - Height of graph plotting area
 * @param {number} xStart - X origin of graph
 * @param {number} yStart - Y origin of graph
 * @param {number} timeScale - Pixels per second scaling
 * @param {number} minY - Minimum Y value from data
 * @param {number} yRange - Y scaling range
 * @param {number} maxY - Maximum Y value from data
 * @param {number} currentTime - Current simulation time
 * @param {boolean} isMobile - Mobile layout flag
 * @returns {Object} Object mapping entity types to their last plotted point coordinates
 * @description Draws glowing oscilloscope-style traces for each RPSLS type based on historical data.
 * Each trace shows adjusted population (count * avgHealth) over the time window.
 * Includes validation for empty/invalid data points and division by zero protection.
 *
 * @throws {Error} Logs warning and returns empty object if rendering fails
 */
function drawTraces(graphWidth, graphHeight, xStart, yStart, timeScale, minY, yRange, maxY, currentTime, isMobile) {
  try {
    // Draw oscilloscope-style traces for each RPSLS type
    const typeColors = COLORS.GRAPH_LINE_COLORS;

    // Store coordinates of last plotted point for each type (for icon positioning)
    const lastPoints = {};

    for (const type of TYPES) {
      const history = typeHistory[type];
      if (!history || history.length === 0) continue;
      if (history.length < 2) continue; // Need at least 2 points for line

      // Set trace styling with type-specific color and responsive line width
      graphCtx.strokeStyle = typeColors[type];
      graphCtx.lineWidth = isMobile ? 2 : 1.5;
      graphCtx.shadowColor = typeColors[type];
      graphCtx.shadowBlur = CONFIG.GRAPH_GLOW_BLUR; // Glowing effect
      graphCtx.beginPath();

      // Draw continuous line from oldest (left) to newest (right) data point
      for (let i = 0; i < history.length; i++) {
        const point = history[i];
        if (!point || typeof point.time === 'undefined' || typeof point.value === 'undefined') continue;

        const timeOffset = currentTime - point.time;
        if (yRange <= 0) continue; // Prevent division by zero in Y scaling

        // Calculate screen coordinates (time flows left to right)
        const x = xStart + (CONFIG.TIME_WINDOW_SECONDS - timeOffset) * timeScale;
        const yValue = point.value;
        const y = yStart + graphHeight - ((yValue - minY) / yRange) * graphHeight;

        if (i === 0) {
          graphCtx.moveTo(x, y); // Start of line
        } else {
          graphCtx.lineTo(x, y); // Continue line
        }

        // Store coordinates of most recent point for current value icon
        if (i === history.length - 1) {
          lastPoints[type] = { x: xStart + graphWidth, y: y }; // Position at right edge
        }
      }

      // Render the trace line and reset glow effect
      graphCtx.stroke();
      graphCtx.shadowBlur = 0; // Reset for subsequent drawing operations
    }

    return lastPoints;
  } catch (error) {
    console.warn('Error drawing traces:', error);
    return {}; // Return empty object to prevent icon positioning errors
  }
}

/**
 * @function drawIcons
 * @param {Object} lastPoints - Object mapping types to their last plotted coordinates
 * @param {number} iconX - X position for all current value icons
 * @param {number} iconSize - Size of the icon symbols
 * @description Draws small RPSLS icons at the current value position for each type.
 * Icons are positioned to the right of the graph at the Y-coordinate of their most recent data point.
 * Uses type-specific colors matching the trace lines.
 */
function drawIcons(lastPoints, iconX, iconSize) {
  // Draw mini icons at the height of the last drawn point for each type
  graphCtx.font = `${iconSize}px sans-serif`;
  graphCtx.textAlign = 'center';
  graphCtx.textBaseline = 'middle';

  for (const type of TYPES) {
    if (lastPoints[type]) {
      const iconY = lastPoints[type].y;
      graphCtx.fillStyle = COLORS.GRAPH_LINE_COLORS[type]; // Match trace color
      graphCtx.fillText(SYMBOLS[type], iconX, iconY);
    }
  }
}

/**
 * @function applyOverlay
 * @description Applies ND-filter style dark overlay to the entire graph canvas.
 * Creates subtle darkening effect while preserving content visibility.
 * Uses semi-transparent black fill matching the configured ND filter opacity.
 */
function applyOverlay() {
  // ND-filter overlay effect for subtle darkening
  graphCtx.fillStyle = COLORS.ND_FILTER_COLOR;
  graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
}

let entities = [];



function spawnEntity() {
  const x = Math.random() * (canvas.width - 2 * CONFIG.ENTITY_RADIUS) + CONFIG.ENTITY_RADIUS;
  const y = Math.random() * (canvas.height - 2 * CONFIG.ENTITY_RADIUS) + CONFIG.ENTITY_RADIUS;
  const angle = Math.random() * 2 * Math.PI;
  const vx = Math.cos(angle) * CONFIG.INITIAL_SPEED;
  const vy = Math.sin(angle) * CONFIG.INITIAL_SPEED;
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];

  const groupCounts = {};
  for (const e of entities) {
    if (e.type === type) {
      groupCounts[e.groupId] = (groupCounts[e.groupId] || 0) + 1;
    }
  }
  let groupId = null;
  for (const gid in groupCounts) {
    if (groupCounts[gid] < 7) {
      groupId = parseInt(gid);
      break;
    }
  }
  if (groupId === null) {
    groupId = nextGroupId++;
  }

  return new Entity(x, y, vx, vy, type, groupId);
}

function initEntities() {
  entities = [];
  for (let i = 0; i < CONFIG.INITIAL_ENTITY_COUNT; i++) {
    entities.push(spawnEntity());
  }
}

/**
 * @function updateSimulation
 * @description Updates the core simulation state for one frame.
 * Handles group management, entity movement, flocking behaviors, collisions,
 * and health redistribution. Called every frame at CONFIG.FPS rate.
 * Maintains separation from UI rendering for better modularity.
 */
function updateSimulation() {
  frameCount++;
  handleGroupSplitting();
  updatePositions();
  applyAlignmentAndAttraction();
  resolveCollisions();
  redistributeHealth();
}

function handleGroupSplitting() {
  const groupSizes = {};
  for (const e of entities) {
    if (!groupSizes[e.groupId]) groupSizes[e.groupId] = [];
    groupSizes[e.groupId].push(e);
  }
  for (const gid in groupSizes) {
    const group = groupSizes[gid];
    if (group.length > 7) {
      const half = Math.ceil(group.length / 2);
      const newGroupId = nextGroupId++;
      for (let i = 0; i < half; i++) {
        group[i].groupId = newGroupId;
      }
    }
  }
}

function updatePositions() {
  for (const entity of entities) {
    entity.update();
  }
}

function applyAlignmentAndAttraction() {
  for (let i = 0; i < entities.length; i++) {
    let e1 = entities[i];

    let avgVx = 0;
    let avgVy = 0;
    let neighborCount = 0;

    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      let e2 = entities[j];
      if (e1.type !== e2.type) continue;

      const dx = e1.x - e2.x;
      const dy = e1.y - e2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (e1.groupId === e2.groupId) {
        if (dist < CONFIG.ALIGN_RADIUS) {
          avgVx += e2.vx;
          avgVy += e2.vy;
          neighborCount++;
        }
      } else {
        if (dist < CONFIG.MAX_ATTRACT_DIST) {
          const nx = dx / dist;
          const ny = dy / dist;
          const force = 0.005;
          e1.vx += nx * force;
          e1.vy += ny * force;
        }
      }
    }

    if (neighborCount > 0) {
      avgVx /= neighborCount;
      avgVy /= neighborCount;

      e1.vx += (avgVx - e1.vx) * CONFIG.ALIGN_FACTOR;
      e1.vy += (avgVy - e1.vy) * CONFIG.ALIGN_FACTOR;
    }
  }
}

function resolveCollisions() {
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const e1 = entities[i];
      const e2 = entities[j];
      const dx = e1.x - e2.x;
      const dy = e1.y - e2.y;
      const distSquared = dx * dx + dy * dy;
      let dist = Math.sqrt(distSquared);
      dist = Math.max(dist, 0.001); // Prevent division by zero

      if (e1.type === e2.type) {
        const nx = dx / dist;
        const ny = dy / dist;

        if (e1.groupId === e2.groupId) {
          if (dist > 2 * CONFIG.HITBOX_RADIUS * 1.2 && dist < CONFIG.MAX_ATTRACT_DIST) {
            const force = 0.01;
            e1.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e1.vx - nx * force));
            e1.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e1.vy - ny * force));
            e2.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e2.vx + nx * force));
            e2.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e2.vy + ny * force));
          } else if (dist < 2 * CONFIG.HITBOX_RADIUS * 1.2) {
            const force = 0.08;
            e1.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e1.vx + nx * force));
            e1.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e1.vy + ny * force));
            e2.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e2.vx - nx * force));
            e2.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e2.vy - ny * force));
          }
        } else {
          if (dist < CONFIG.MAX_ATTRACT_DIST) {
            const force = 0.005;
            e1.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e1.vx + nx * force));
            e1.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e1.vy + ny * force));
            e2.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e2.vx - nx * force));
            e2.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, e2.vy - ny * force));
          }
        }

        const minDist = 2 * CONFIG.HITBOX_RADIUS;
        if (dist < minDist) {
          const overlap = Math.min(minDist - dist, minDist * 0.5); // Limit correction amount
          const correctionX = (nx * overlap) / 2;
          const correctionY = (ny * overlap) / 2;
          e1.x = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.width - CONFIG.ENTITY_RADIUS, e1.x + correctionX));
          e1.y = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.height - CONFIG.ENTITY_RADIUS, e1.y + correctionY));
          e2.x = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.width - CONFIG.ENTITY_RADIUS, e2.x - correctionX));
          e2.y = Math.max(CONFIG.ENTITY_RADIUS, Math.min(canvas.height - CONFIG.ENTITY_RADIUS, e2.y - correctionY));
        }
      }

      if (dist < 2 * CONFIG.HITBOX_RADIUS) {
        // Damage entities of same type but different groups on collision
        if (e1.type === e2.type && e1.groupId !== e2.groupId) {
          if (
            frameCount > e1.lastDamageFrame + CONFIG.DAMAGE_COOLDOWN_FRAMES &&
            frameCount > e2.lastDamageFrame + CONFIG.DAMAGE_COOLDOWN_FRAMES
          ) {
            const damage = Math.min(e1.maxAge * 0.1, e1.maxAge * 0.5); // Cap damage at 50%
            e1.age = Math.min(e1.maxAge, e1.age + damage);
            e2.age = Math.min(e2.maxAge, e2.age + damage);
            e1.lastDamageFrame = frameCount;
            e2.lastDamageFrame = frameCount;
          }

          // Check if groups should merge
          const group1Size = Math.max(0, entities.filter(e => e.type === e1.type && e.groupId === e1.groupId).length);
          const group2Size = Math.max(0, entities.filter(e => e.type === e2.type && e.groupId === e2.groupId).length);
          if (group1Size + group2Size <= 7) {
            const oldGroupId = e2.groupId;
            const newGroupId = e1.groupId;
            for (const ent of entities) {
              if (ent.type === e1.type && ent.groupId === oldGroupId) {
                ent.groupId = newGroupId;
              }
            }
          }
        }
        handleInteraction(e1, e2);
      }
    }
  }

  for (let i = 0; i < entities.length; i++) {
    if (entities[i].isDead()) {
      entities[i] = spawnEntity();
    }
  }
}

function redistributeHealth() {
  const REDISTRIBUTION_RADIUS = CONFIG.ALIGN_RADIUS;
  const REDISTRIBUTION_FACTOR = 0.05;

  for (let i = 0; i < entities.length; i++) {
    const e1 = entities[i];
    let sumAge = 0;
    let count = 0;

    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      const e2 = entities[j];

      if (e1.type !== e2.type) continue;
      if (e1.groupId !== e2.groupId) continue;

      const dx = e1.x - e2.x;
      const dy = e1.y - e2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REDISTRIBUTION_RADIUS) {
        sumAge += e2.age;
        count++;
      }
    }

    if (count > 0) {
      const avgAge = sumAge / count;
      e1.age += (avgAge - e1.age) * REDISTRIBUTION_FACTOR;
    }
  }
}

function handleInteraction(e1, e2) {
  if (beats[e1.type].includes(e2.type)) {
    const hunter = e1;
    const prey = e2;

    const preyHealth = (prey.maxAge - prey.age) / prey.maxAge;

    // Find all group members
    const groupMembers = entities.filter(ent => ent.groupId === hunter.groupId && ent.type === hunter.type);

    let groupTotalHealth = 0;
    for (const member of groupMembers) {
      groupTotalHealth += (member.maxAge - member.age) / member.maxAge;
    }

    const maxGroupHealth = groupMembers.length;

    if (groupTotalHealth + preyHealth <= maxGroupHealth) {
      // Distribute prey's health among group members
      const totalHealthGain = prey.maxAge - prey.age;
      const healthPerMember = totalHealthGain / groupMembers.length;

      for (const member of groupMembers) {
        member.age -= healthPerMember;
        if (member.age < 0) member.age = 0;
      }

      // Prey dies
      prey.age = prey.maxAge;
    } else {
      // Convert prey to hunter's group/type
      prey.type = hunter.type;
      // e1.resetAge();
      // e2.resetAge();
      prey.groupId = hunter.groupId;
    }
  } else if (beats[e2.type].includes(e1.type)) {
    const hunter2 = e2;
    const prey2 = e1;

    const prey2Health = (prey2.maxAge - prey2.age) / prey2.maxAge;

    // Find all group members
    const groupMembers2 = entities.filter(ent => ent.groupId === hunter2.groupId && ent.type === hunter2.type);

    let groupTotalHealth2 = 0;
    for (const member of groupMembers2) {
      groupTotalHealth2 += (member.maxAge - member.age) / member.maxAge;
    }

    const maxGroupHealth2 = groupMembers2.length;

    if (groupTotalHealth2 + prey2Health <= maxGroupHealth2) {
      // Distribute prey's health among group members
      const totalHealthGain2 = prey2.maxAge - prey2.age;
      const healthPerMember2 = totalHealthGain2 / groupMembers2.length;

      for (const member of groupMembers2) {
        member.age -= healthPerMember2;
        if (member.age < 0) member.age = 0;
      }

      // Prey dies
      prey2.age = prey2.maxAge;
    } else {
      // Convert prey to hunter's group/type
      prey2.type = hunter2.type;
      // e1.resetAge();
      // e2.resetAge();
      prey2.groupId = hunter2.groupId;
    }
  }
}

function updateUI(currentTime) {
  if (!statsCtx) {
    console.warn('Stats context not available');
    return;
  }

  try {
    // Update stats 4 times per second (every CONFIG.STATS_UPDATE_INTERVAL frames)
    if (frameCount % CONFIG.STATS_UPDATE_INTERVAL !== 0) {
      return;
    }

    const stats = computeStats();

    // Update graph history 4 times per second (CONFIG.GRAPH_UPDATE_INTERVAL frames)
    if (frameCount - lastGraphUpdateFrame >= CONFIG.GRAPH_UPDATE_INTERVAL) {
      updateGraphHistory(stats, currentTime);
      lastGraphUpdateFrame = frameCount;
    }

    // Responsive stats canvas positioning
    const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
    const statsWidth = isMobile ? window.innerWidth * CONFIG.STATS_MOBILE_WIDTH_PCT : 250;
    const statsHeight = isMobile ? window.innerHeight * CONFIG.STATS_MOBILE_HEIGHT_PCT : 200;
    const statsFontSize = isMobile ? 14 : 12;

    statsCanvas.width = statsWidth;
    statsCanvas.height = statsHeight;
    statsCanvas.style.position = 'absolute';
    statsCanvas.style.top = isMobile ? 'auto' : '10px';
    statsCanvas.style.right = isMobile ? 'auto' : '10px';
    statsCanvas.style.bottom = isMobile ? '10px' : 'auto';
    statsCanvas.style.left = isMobile ? '5%' : 'auto';
    statsCanvas.style.transform = isMobile ? 'translateX(-50%)' : 'none';
    statsCanvas.style.background = 'rgba(0,0,0,0.7)';
    statsCanvas.style.borderRadius = isMobile ? '12px' : '8px';
    statsCanvas.style.padding = isMobile ? '15px' : '10px';
    statsCanvas.style.fontFamily = 'sans-serif';
    statsCanvas.style.fontSize = `${statsFontSize}px`;
    statsCanvas.style.color = 'white';
    statsCanvas.style.zIndex = `${CONFIG.UI_Z_INDEX}`;
    statsCanvas.style.textAlign = isMobile ? 'center' : 'left';

    statsCtx.clearRect(0, 0, statsCanvas.width, statsCanvas.height);

    let y = 20;
    statsCtx.fillStyle = COLORS.STATS_TITLE;
    statsCtx.font = `bold ${statsFontSize + 2}px sans-serif`;
    statsCtx.textAlign = 'center';
    statsCtx.fillText('RPSLS Stats', statsCanvas.width / 2, y);
    y += 25;

    statsCtx.fillStyle = COLORS.STATS_TEXT;
    statsCtx.font = `${statsFontSize}px sans-serif`;
    statsCtx.textAlign = 'center';
    for (const type of TYPES) {
      const data = stats[type];
      if (data && typeof data.avgHealth !== 'undefined') {
        statsCtx.fillText(`${SYMBOLS[type]} ${type}: ${data.count} (${(data.avgHealth * 100).toFixed(1)}% health)`, statsCanvas.width / 2, y);
      } else {
        statsCtx.fillText(`${SYMBOLS[type]} ${type}: ${data.count} (0% health)`, statsCanvas.width / 2, y);
      }
      y += 18;
    }

    // ND-filter overlay effect for stats
    statsCtx.fillStyle = COLORS.ND_FILTER_COLOR;
    statsCtx.fillRect(0, 0, statsCanvas.width, statsCanvas.height);
  } catch (error) {
    console.warn('Error updating UI:', error);
  }
}

function drawEntities() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const entity of entities) {
    entity.draw(ctx);
  }

  const currentTime = frameCount / CONFIG.FPS;

  updateUI(currentTime);

  // Draw graph canvas every frame (oscilloscope style)
  drawGraph(currentTime);
}

function animate() {
  updateSimulation();
  drawEntities();

  requestAnimationFrame(animate);
}

initEntities();
animate();