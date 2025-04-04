const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const ENTITY_RADIUS = 30;
const HITBOX_RADIUS = ENTITY_RADIUS * 0.64;
const INITIAL_ENTITY_COUNT = 30;
const MAX_AGE_SECONDS = 60;
const FPS = 60;
const DAMAGE_COOLDOWN_FRAMES = 120; // 2 seconds cooldown
const MAX_AGE_FRAMES = MAX_AGE_SECONDS * FPS;

const INITIAL_SPEED = 2;
const MAX_SPEED = INITIAL_SPEED * 1.2;
const TARGET_SPEED = INITIAL_SPEED;
const SPEED_ADJUST_FACTOR = 0.02;

const MAX_ATTRACT_DIST = 10 * HITBOX_RADIUS;
const ALIGN_RADIUS = MAX_ATTRACT_DIST;
const ALIGN_FACTOR = 0.05;

const EDGE_MARGIN = 100;
const EDGE_FORCE = 0.05;

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

class Entity {
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

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < EDGE_MARGIN) this.vx += EDGE_FORCE;
    else if (this.x > canvas.width - EDGE_MARGIN) this.vx -= EDGE_FORCE;
    if (this.y < EDGE_MARGIN) this.vy += EDGE_FORCE;
    else if (this.y > canvas.height - EDGE_MARGIN) this.vy -= EDGE_FORCE;

    if (this.x <= ENTITY_RADIUS) {
      this.x = ENTITY_RADIUS;
      this.vx = Math.abs(this.vx);
    }
    if (this.x >= canvas.width - ENTITY_RADIUS) {
      this.x = canvas.width - ENTITY_RADIUS;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y <= ENTITY_RADIUS) {
      this.y = ENTITY_RADIUS;
      this.vy = Math.abs(this.vy);
    }
    if (this.y >= canvas.height - ENTITY_RADIUS) {
      this.y = canvas.height - ENTITY_RADIUS;
      this.vy = -Math.abs(this.vy);
    }

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed < TARGET_SPEED) {
      const scale = 1 + SPEED_ADJUST_FACTOR;
      this.vx *= scale;
      this.vy *= scale;
    } else if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.age++;
  }

  draw(ctx) {
    // Draw glow as filled circle with shadow
    ctx.save();
    const hue = (this.groupId * 137) % 360;
    ctx.shadowColor = `hsla(${hue}, 80%, 50%, 0.5)`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.2)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, HITBOX_RADIUS + 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();


    ctx.globalAlpha = 1.0;
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SYMBOLS[this.type], this.x, this.y);

    ctx.save();

    const barWidth = 40;
    const barHeight = 6;
    const healthRatio = (this.maxAge - this.age) / this.maxAge;
    const barX = this.x - barWidth / 2;
    const barY = this.y - ENTITY_RADIUS - 4;

    let r, g;
    if (healthRatio > 0.5) {
      const t = (1 - healthRatio) * 2;
      r = Math.floor(255 * t);
      g = 255;
    } else {
      const t = (0.5 - healthRatio) * 2;
      r = 255;
      g = Math.floor(255 * (1 - t));
    }

    ctx.fillStyle = `rgba(${r},${g},0,0.5)`;
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.restore();
  }

  resetAge() {
    this.age = 0;
  }

  isDead() {
    return this.age >= this.maxAge;
  }
}

let entities = [];

function spawnEntity() {
  const x = Math.random() * (canvas.width - 2 * ENTITY_RADIUS) + ENTITY_RADIUS;
  const y = Math.random() * (canvas.height - 2 * ENTITY_RADIUS) + ENTITY_RADIUS;
  const angle = Math.random() * 2 * Math.PI;
  const vx = Math.cos(angle) * INITIAL_SPEED;
  const vy = Math.sin(angle) * INITIAL_SPEED;
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
  for (let i = 0; i < INITIAL_ENTITY_COUNT; i++) {
    entities.push(spawnEntity());
  }
}

function updateEntities() {
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
        if (dist < ALIGN_RADIUS) {
          avgVx += e2.vx;
          avgVy += e2.vy;
          neighborCount++;
        }
      } else {
        if (dist < MAX_ATTRACT_DIST) {
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

      e1.vx += (avgVx - e1.vx) * ALIGN_FACTOR;
      e1.vy += (avgVy - e1.vy) * ALIGN_FACTOR;
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
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (e1.type === e2.type) {
        const nx = dx / dist;
        const ny = dy / dist;

        if (e1.groupId === e2.groupId) {
          if (dist > 2 * HITBOX_RADIUS * 1.2 && dist < MAX_ATTRACT_DIST) {
            const force = 0.01;
            e1.vx -= nx * force;
            e1.vy -= ny * force;
            e2.vx += nx * force;
            e2.vy += ny * force;
          } else if (dist < 2 * HITBOX_RADIUS * 1.2) {
            const force = 0.08;
            e1.vx += nx * force;
            e1.vy += ny * force;
            e2.vx -= nx * force;
            e2.vy -= ny * force;
          }
        } else {
          if (dist < MAX_ATTRACT_DIST) {
            const force = 0.005;
            e1.vx += nx * force;
            e1.vy += ny * force;
            e2.vx -= nx * force;
            e2.vy -= ny * force;
          }
        }

        const minDist = 2 * HITBOX_RADIUS;
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const correctionX = (nx * overlap) / 2;
          const correctionY = (ny * overlap) / 2;
          e1.x += correctionX;
          e1.y += correctionY;
          e2.x -= correctionX;
          e2.y -= correctionY;
        }
      }

      if (dist < 2 * HITBOX_RADIUS) {
        // Damage entities of same type but different groups on collision
        if (e1.type === e2.type && e1.groupId !== e2.groupId) {
          if (
            frameCount > e1.lastDamageFrame + DAMAGE_COOLDOWN_FRAMES &&
            frameCount > e2.lastDamageFrame + DAMAGE_COOLDOWN_FRAMES
          ) {
            const damage = e1.maxAge * 0.1; // 10% of lifespan
            e1.age += damage;
            e2.age += damage;
            e1.lastDamageFrame = frameCount;
            e2.lastDamageFrame = frameCount;
          }

          // Check if groups should merge
          const group1Size = entities.filter(e => e.type === e1.type && e.groupId === e1.groupId).length;
          const group2Size = entities.filter(e => e.type === e2.type && e.groupId === e2.groupId).length;
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
  const REDISTRIBUTION_RADIUS = ALIGN_RADIUS;
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

function drawEntities() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const entity of entities) {
    entity.draw(ctx);
  }
}

function animate() {
  updateEntities();
  drawEntities();

  requestAnimationFrame(animate);
}

initEntities();
animate();