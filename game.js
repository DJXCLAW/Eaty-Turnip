// Get the canvas element and its 2D drawing context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set the canvas dimensions to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Game variables
const PLAYER_SIZE = 80;
const ENEMY_SIZE = 32;
const BULLET_SIZE = 8;
const BASE_PLAYER_SPEED = 5;
const BASE_BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 1;
const DAMAGE_AMOUNT = 10;
let playerCoins = 999999; // for testing
let playerXP = 0;
let playerLevel = 0;
let playerWeapon = "pistol"; // Default weapon
let playerHp = 100;
let XpNeededToLevel = 100;

let player = {
  x: canvas.width / 2 - PLAYER_SIZE / 2,
  y: canvas.height - PLAYER_SIZE * 2,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  speed: BASE_PLAYER_SPEED,
  hp: playerHp,
  angle: 0,
};

let bullets = [];
let enemies = [];
let enemyBullets = []; // Track enemy bullets
let lastFireTime = 0;
let waveNumber = 1;

const FIRE_RATE = 200;
const SHOTGUN_FIRE_RATE = 500;
const MINIGUN_FIRE_RATE = 30;
const SNIPER_FIRE_RATE = 1000;
const SNIPER_PENETRATION = 3;
const ENEMY_SPAWN_RATE = 5;
const weapons = {
  pistol: { id: 1, cost: 0, unlocked: true }, // Pistol is unlocked by default
  shotgun: { id: 2, cost: 100, unlocked: false },
  minigun: { id: 3, cost: 500, unlocked: false },
  sniper: { id: 4, cost: 300, unlocked: false },
};

let gamePaused = false;
let gameOver = false;
let gameLoopRunning = false; // Ensure only one loop instance runs

// Key handling
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") shoot();
// Fire bullets when the player clicks on the canvas
canvas.addEventListener("click", function () {
  shoot();
});

  // Check for Enter key press to toggle the shop
  if (e.key === "Enter") {
    if (document.getElementById("shopContainer").style.display === "flex") {
      hideShop();
    } else {
      showShop();
    }
  }

  // Handle weapon switching
  if (e.key >= "1" && e.key <= "4") {
    let weaponKey;
    if (e.key === "1") weaponKey = "pistol";
    if (e.key === "2") weaponKey = "shotgun";
    if (e.key === "3") weaponKey = "minigun";
    if (e.key === "4") weaponKey = "sniper";

    const weapon = weapons[weaponKey];
    if (weapon) {
      if (weapon.unlocked) {
        if (playerWeapon !== weaponKey) {
          playerWeapon = weaponKey;
          updateHUD();
        } else {
          alert("Already equipped!");
        }
      } else {
        alert("Not purchased!");
      }
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Enemy class to handle enemy properties and behavior
class Enemy {
  constructor(
    x,
    y,
    width,
    height,
    health,
    speed,
    canShoot = false,
    fireRate = 0
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.health = health;
    this.speed = speed;
    this.canShoot = canShoot;
    this.fireRate = 2000 + Math.random() * 1000; // Add randomness to the fire rate
    this.lastShotTime = 0; // To control shooting intervals
  }

  // Update enemy position
  update(playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.x += (dx / distance) * this.speed;
    this.y += (dy / distance) * this.speed;
  }

  // Draw the enemy
  draw(ctx) {
    ctx.fillStyle = this.canShoot ? "green" : "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Enemy shoot logic
  shoot(playerX, playerY) {
    const now = Date.now();
    if (this.canShoot && now - this.lastShotTime > this.fireRate) {
      this.lastShotTime = now;
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      const bulletSpeed = 4;
      return {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
        width: BULLET_SIZE,
        height: BULLET_SIZE,
      };
    }
    return null;
  }

  // Handle enemy taking damage
  takeDamage(damage) {
    this.health -= damage;
    return this.health <= 0;
  }
}

// Handling leveling up
function levelUp() {
  if (playerXP >= XpNeededToLevel) {
    playerXP -= XpNeededToLevel;
    playerLevel++; // Increment the level
    XpNeededToLevel *= 1.2; // Increase the XP needed for the next level
    updateHUD(); // Ensure HUD gets updated
  }
}

// Shop functions
function buyHealthUpgrade() {
  if (playerCoins >= 50) {
    playerCoins -= 50;
    player.hp = Math.min(player.hp + 50, 100); // Cap health at 100
    updateHUD();
    alert("Health upgraded!");
  } else {
    alert("Not enough coins!");
  }
}

function buyBulletSpeedUpgrade() {
  if (
  
playerCoins >= 100) {
    playerCoins -= 100;
    BASE_BULLET_SPEED += 2;
    updateHUD();
  } else {
    alert("Not enough coins!");
  }
}

function buyPlayerSpeedUpgrade() {
  if (playerCoins >= 100) {
    playerCoins -= 100;
    player.speed += 2;
    updateHUD();
  } else {
    alert("Not enough coins!");
  }
}

function buyWeapon(weaponKey) {
  const weapon = weapons[weaponKey];
  if (playerCoins >= weapon.cost && !weapon.unlocked) {
    playerCoins -= weapon.cost;
    weapon.unlocked = true;
    document.getElementById(`${weaponKey}Status`).innerText = "Purchased";
    updateHUD();
  } else if (weapon.unlocked) {
    alert("Already purchased!");
  } else {
    alert("Not enough coins!");
  }
}

function buyShotgun() {
  buyWeapon("shotgun");
}

function buyMinigun() {
  buyWeapon("minigun");
}

function buySniper() {
  buyWeapon("sniper");
}

// Update the HUD
function updateHUD() {
  document.getElementById("score").innerText = `Score: ${waveNumber * 100}`;
  document.getElementById("health").innerText = `HP: ${player.hp}`;
  document.getElementById("currency").innerText = `Currency: ${playerCoins}`;
  document.getElementById("level").innerText = `Level: ${playerLevel}`;
}

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Load the player texture
const playerImage = new Image();
playerImage.src = "https://cdn.glitch.global/fadba06a-53b9-4278-aed7-4c499cf944a0/hackerdude.png?v=1730570199507";

// Draw the player
function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate(player.angle);
  ctx.drawImage(
    playerImage,
    -player.width / 2,
    -player.height / 2,
    player.width,
    player.height
  );
  ctx.restore();
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = "green";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE);
  });
}

// Draw enemies
function drawEnemies() {
  enemies.forEach((enemy) => {
    enemy.draw(ctx);
  });
}

// Draw enemy bullets
function drawEnemyBullets() {
  ctx.fillStyle = "purple";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// Update player position
function updatePlayer() {
  if (keys["a"] || keys["ArrowLeft"])
    player.x = Math.max(0, player.x - player.speed);
  if (keys["d"] || keys["ArrowRight"])
    player.x = Math.min(canvas.width - player.width, player.x + player.speed);
  if (keys["w"] || keys["ArrowUp"])
    player.y = Math.max(0, player.y - player.speed);
  if (keys["s"] || keys["ArrowDown"])
    player.y = Math.min(canvas.height - player.height, player.y + player.speed);
}

// Update bullets
function updateBullets() {
  bullets = bullets.filter(
    (bullet) =>
      bullet.x > 0 &&
      bullet.x < canvas.width &&
      bullet.y > 0 &&
      bullet.y < canvas.height
  );
  bullets.forEach((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  });
}

// Update enemy bullets
function updateEnemyBullets() {
  enemyBullets = enemyBullets.filter(
    (bullet) =>
      bullet.x > 0 &&
      bullet.x < canvas.width &&
      bullet.y > 0 &&
      bullet.y < canvas.height
  );
  enemyBullets.forEach((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  });
}

// Update enemies
function updateEnemies() {
  enemies.forEach((enemy) => {
    enemy.update(player.x, player.y);
    const bullet = enemy.shoot(player.x, player.y);
    if (bullet) {
      enemyBullets.push(bullet);
    }
  });
}

// Function for collisions
function checkCollisions() {
  // Bullet-enemy collisions
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + BULLET_SIZE > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + BULLET_SIZE > enemy.y
      ) {
        let damage = 2;
        if (playerWeapon === "shotgun") damage = 3;
        if (playerWeapon === "sniper") damage = 5;
        if (playerWeapon === "minigun") damage = 0.5;
        if (enemy.takeDamage(damage)) {
          enemies.splice(enemyIndex, 1);
          playerCoins += 10;
          playerXP += 10;
          updateHUD();
        }
        bullets.splice(bulletIndex, 1);
      }
    });
  });

  // Enemy bullet-player collisions
  enemyBullets.forEach((bullet, bulletIndex) => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + BULLET_SIZE > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + BULLET_SIZE > player.y
    ) {
      player.hp -= DAMAGE_AMOUNT;
      updateHUD();
      enemyBullets.splice(bulletIndex, 1);
      if (player.hp <= 0) {
        endGame();
      }
    }
  });

  // Player-enemy collisions (ramming)
  enemies.forEach((enemy, enemyIndex) => {
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      player.hp -= DAMAGE_AMOUNT;
      updateHUD();
      enemies.splice(enemyIndex, 1); // Remove enemy after collision
      if (player.hp <= 0) {
        endGame();
      }
    }
  });
}

// Spawn a new wave if there are no enemies
function checkWaveCompletion() {
  if (!gamePaused && enemies.length === 0 && !gameOver) {
    nextWave();
  }
}

// Spawn enemies
function spawnEnemies() {
  for (let i = 0; i < ENEMY_SPAWN_RATE * waveNumber; i++) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
      case 0:
        x = Math.random() * canvas.width;
        y = -ENEMY_SIZE;
        break;
      case 1:
        x = canvas.width;
        y = Math.random() * canvas.height;
        break;
      case 2:
        x = Math.random() * canvas.width;
        y = canvas.height;
        break;
      case 3:
        x = -ENEMY_SIZE;
        y = Math.random() * canvas.height;
        break;
    }
    const isShooter = Math.random() < 0.3;
    let newEnemy;
    if (isShooter) {
      newEnemy = new Enemy(
        x,
        y,
        ENEMY_SIZE,
        ENEMY_SIZE,
        5,
        BASE_ENEMY_SPEED / 1.5,
        true,
        2000
      );
    } else {
      newEnemy = new Enemy(x, y, ENEMY_SIZE, ENEMY_SIZE, 5, BASE_ENEMY_SPEED);
    }
    enemies.push(newEnemy);
  }
}

// Shoot bullets
function shoot() {
  const now = Date.now();
  let fireRate = FIRE_RATE;
  if (playerWeapon === "shotgun") fireRate = SHOTGUN_FIRE_RATE;
  if (playerWeapon === "minigun") fireRate = MINIGUN_FIRE_RATE;
  if (playerWeapon === "sniper") fireRate = SNIPER_FIRE_RATE;

  if (now - lastFireTime > fireRate) {
    if (playerWeapon === "shotgun") {
      for (let i = -1; i <= 1; i++) {
        const angleOffset = (Math.PI / 12) * i;
        const angle = player.angle + angleOffset;
        bullets.push({
          x: player.x + player.width / 2,
          y: player.y + player.height / 2,
          vx: Math.cos(angle) * BASE_BULLET_SPEED,
          vy: Math.sin(angle) * BASE_BULLET_SPEED,
        });
      }
    } else if (playerWeapon === "minigun" || playerWeapon === "sniper") {
      bullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(player.angle) * BASE_BULLET_SPEED,
        vy: Math.sin(player.angle) * BASE_BULLET_SPEED,
      });
    } else {
      bullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(player.angle) * BASE_BULLET_SPEED,
        vy: Math.sin(player.angle) * BASE_BULLET_SPEED,
      });
    }
    lastFireTime = now;
  }
}

// End the game
function endGame() {
  gameOver = true;
  alert("Game Over (Refresh your tab)");
}

// Start the next wave
function nextWave() {
  waveNumber++;
  spawnEnemies();
  updateHUD();
}

// Main game loop
function gameLoop() {
  function loop() {
    if (!gamePaused && !gameOver) {
      gameLoopRunning = true;
      clearCanvas();
      drawPlayer();
      drawBullets();
      drawEnemyBullets();
      drawEnemies();
      updatePlayer();
      updateBullets();
      updateEnemyBullets();
      updateEnemies();
      checkCollisions();  // Ensure collisions are checked every frame
      checkWaveCompletion(); // Check if it's time for a new wave
      
      levelUp();
      requestAnimationFrame(loop);
    } else {
      gameLoopRunning = false;
    }
  }
  if (!gameLoopRunning && !gamePaused && !gameOver) {
    loop();
  }
}

// Initialize the game
document.getElementById("shopContainer").style.display = "none"; // Hide shop at start
gameLoop();

// Track the mouse position and calculate the angle for shooting
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  player.angle = Math.atan2(
    mouseY - (player.y + player.height / 2),
    mouseX - (player.x + player.width / 2)
  );
});
