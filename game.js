// Get the canvas element and its 2D drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set the canvas dimensions to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
const PLAYER_SIZE = 32;
const ENEMY_SIZE = 32;
const BULLET_SIZE = 8;
const BASE_PLAYER_SPEED = 5;
const BASE_BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 1;
const DAMAGE_AMOUNT = 10;
let playerCoins = 9999999;
let playerWeapon = 'pistol'; // Default weapon
let playerHp = 100;
let player = {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: canvas.height - PLAYER_SIZE * 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: BASE_PLAYER_SPEED,
    hp: playerHp,
    angle: 0
};
let bullets = [];
let enemies = [];
let lastFireTime = 0;
let waveNumber = 1;
const FIRE_RATE = 200;
const SHOTGUN_FIRE_RATE = 500;
const MINIGUN_FIRE_RATE = 1;
const SNIPER_FIRE_RATE = 1000;
const SNIPER_PENETRATION = 3;
const ENEMY_SPAWN_RATE = 5;
const weapons = {
    pistol: { id: 1, cost: 0, unlocked: true }, // Pistol is unlocked by default
    shotgun: { id: 2, cost: 100, unlocked: false },
    minigun: { id: 3, cost: 500, unlocked: false },
    sniper: { id: 4, cost: 300, unlocked: false }
};

let gamePaused = false;
let gameOver = false;
let gameLoopRunning = false; // Ensure only one loop instance runs

// Key handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        shoot();
    }

    // Check for Enter key press to toggle the shop
    if (e.key === 'Enter') {
        if (document.getElementById('shopContainer').style.display === 'flex') {
            hideShop();
        } else {
            showShop();
        }
    }

    // Handle weapon switching
    if (e.key >= '1' && e.key <= '4') {
        let weaponKey;
        if (e.key === '1') weaponKey = 'pistol';
        if (e.key === '2') weaponKey = 'shotgun';
        if (e.key === '3') weaponKey = 'minigun';
        if (e.key === '4') weaponKey = 'sniper';

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

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update the HUD elements
function updateHUD() {
    document.getElementById('score').innerText = `Score: ${waveNumber * 100}`;
    document.getElementById('health').innerText = `HP: ${player.hp}`;
    document.getElementById('currency').innerText = `Currency: ${playerCoins}`;
}

// Helper function to clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to draw the player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);
    ctx.fillStyle = 'blue';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

// Function to draw bullets
function drawBullets() {
    ctx.fillStyle = 'green';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE);
    });
}

// Function to draw enemies
function drawEnemies() {
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Function to update the player's position
function updatePlayer() {
    if (keys['a'] || keys['ArrowLeft']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['d'] || keys['ArrowRight']) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
    if (keys['w'] || keys['ArrowUp']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['s'] || keys['ArrowDown']) {
        player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    }
}

// Function to update the bullets' positions
function updateBullets() {
    bullets = bullets.filter(bullet => bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height);
    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });
}

// Function to update the enemies' positions
function updateEnemies() {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        enemy.x += (dx / distance) * BASE_ENEMY_SPEED;
        enemy.y += (dy / distance) * BASE_ENEMY_SPEED;
    });
}

// Function to check for collisions and enemy defeat
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + BULLET_SIZE > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + BULLET_SIZE > enemy.y) {

                let damage = playerWeapon === 'shotgun' ? 3 : 2;
                if (playerWeapon === 'sniper') {
                    damage = 5;
                }
                enemy.health -= damage;

                if (playerWeapon === 'sniper' && bullet.penetration > 1) {
                    bullet.penetration--;
                } else {
                    bullets.splice(bulletIndex, 1);
                }

                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    playerCoins += 10;
                    updateHUD();
                }
            }
        });
    });

    enemies.forEach((enemy, enemyIndex) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            player.hp -= DAMAGE_AMOUNT;
            updateHUD();
            enemies.splice(enemyIndex, 1);

            if (player.hp <= 0) {
                endGame();
            }
        }
    });

    if (enemies.length === 0 && !gameOver) {
        nextWave();
    }
}

// Function to spawn enemies
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

        const enemy = {
            x: x,
            y: y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE,
            health: 5
        };

        enemies.push(enemy);
    }
}

// Function to handle shooting
function shoot() {
    const now = Date.now();
    let fireRate;

    if (playerWeapon === 'shotgun') {
        fireRate = SHOTGUN_FIRE_RATE;
    } else if (playerWeapon === 'minigun') {
        fireRate = MINIGUN_FIRE_RATE;
    } else if (playerWeapon === 'sniper') {
        fireRate = SNIPER_FIRE_RATE;
    } else {
        fireRate = FIRE_RATE;
    }

    if (now - lastFireTime > fireRate) {
        if (playerWeapon === 'shotgun') {
            for (let i = -1; i <= 1; i++) {
                const angleOffset = (Math.PI / 12) * i;
                const angle = player.angle + angleOffset;
                bullets.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    vx: Math.cos(angle) * BASE_BULLET_SPEED,
                    vy: Math.sin(angle) * BASE_BULLET_SPEED,
                    penetration: 1
                });
            }
        } else if (playerWeapon === 'minigun') {
            bullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: Math.cos(player.angle) * BASE_BULLET_SPEED,
                vy: Math.sin(player.angle) * BASE_BULLET_SPEED,
                penetration: 1
            });
        } else if (playerWeapon === 'sniper') {
            bullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: Math.cos(player.angle) * BASE_BULLET_SPEED,
                vy: Math.sin(player.angle) * BASE_BULLET_SPEED,
                penetration: SNIPER_PENETRATION
            });
        } else {
            bullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: Math.cos(player.angle) * BASE_BULLET_SPEED,
                vy: Math.sin(player.angle) * BASE_BULLET_SPEED,
                penetration: 1
            });
        }
        lastFireTime = now;
    }
}


// Shop functions
function buyHealthUpgrade() {
    if (playerCoins >= 50) {
        playerCoins -= 50;
        player.hp = Math.min(player.hp + 50, playerHp);
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

function buyBulletSpeedUpgrade() {
    if (playerCoins >= 100) {
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
    const weapon = weapons[weaponKey]; // Get the weapon object from weapons list

    // Check if the player has enough coins and the weapon is not unlocked
    if (playerCoins >= weapon.cost && !weapon.unlocked) {
        playerCoins -= weapon.cost; // Deduct the weapon cost from player coins
        weapon.unlocked = true;     // Unlock the weapon
        playerWeapon = weaponKey;   // Equip the purchased weapon

        // Update the status on the UI and update the HUD
        document.getElementById(`${weaponKey}Status`).innerText = 'Purchased';
        updateHUD();
    } else if (weapon.unlocked) {
        alert("Already purchased!");
    } else {
        alert("Not enough coins!");
    }
}

function buyShotgun() {
    buyWeapon('shotgun');
}

function buyMinigun() {
    buyWeapon('minigun');
}

function buySniper() {
    buyWeapon('sniper');
}


// Function to end the game
function endGame() {
    gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
    gamePaused = true;
}

// Function to start the next wave
function nextWave() {
    waveNumber++;
    spawnEnemies();
    updateHUD();
}

// Function to display the shop UI
function showShop() {
    gamePaused = true;
    document.getElementById('shopContainer').style.display = 'flex';
}

// Function to close the shop UI
function hideShop() {
    gamePaused = false;
    document.getElementById('shopContainer').style.display = 'none';
    if (!gameLoopRunning) {
        gameLoop(); // Resume the game loop
    }
}

// Event listener for mouse movement to update player angle
canvas.addEventListener('mousemove', (e) => {
    player.angle = calculateAngleToMouse(e.clientX, e.clientY);
});

// Function to calculate the angle to the mouse
function calculateAngleToMouse(mouseX, mouseY) {
    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    return Math.atan2(dy, dx);
}

// Game loop
function gameLoop() {
    if (!gamePaused && !gameOver && !gameLoopRunning) {
        gameLoopRunning = true; // Set the flag to prevent multiple loops
        function loop() {
            if (!gamePaused && !gameOver) {
                clearCanvas();
                updatePlayer();
                updateBullets();
                updateEnemies();
                checkCollisions();
                drawPlayer();
                drawBullets();
                drawEnemies();
                requestAnimationFrame(loop);
            } else {
                gameLoopRunning = false; // Reset the flag if game is paused or over
            }
        }
        loop();
    }
}

// Start the game loop
gameLoop();
