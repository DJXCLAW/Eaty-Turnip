const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PLAYER_SIZE = 20;
const PLAYER_COLOR = 'blue';
const BULLET_COLOR = 'white';
const ENEMY_SIZE = 20;
const ENEMY_COLOR = 'red';
const BULLET_SPEED = 5;
const ENEMY_SPEED = 1;
const ENEMY_SPAWN_RATE = 5;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: 4,
    health: 100,
    angle: 0
};

let bullets = [];
let enemies = [];
let playerWeapon = 'pistol';
let playerCoins = 0;
let gameOver = false;
let waveNumber = 1;
let gamePaused = false;
let gameLoopRunning = false;

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = BULLET_COLOR;
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = ENEMY_COLOR;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function updatePlayer() {
    if (keys['w']) player.y -= player.speed;
    if (keys['s']) player.y += player.speed;
    if (keys['a']) player.x -= player.speed;
    if (keys['d']) player.x += player.speed;

    // Keep the player within the canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width) player.x = canvas.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height) player.y = canvas.height;
}
function updatePlayer() {
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // Keep the player within the canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width) player.x = canvas.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height) player.y = canvas.height;
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx * BULLET_SPEED;
        bullet.y += bullet.dy * BULLET_SPEED;

        // Remove bullets that go off screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        enemy.x += (dx / dist) * ENEMY_SPEED;
        enemy.y += (dy / dist) * ENEMY_SPEED;
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x > enemy.x &&
                bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y &&
                bullet.y < enemy.y + enemy.height
            ) {
                // Damage the enemy based on the weapon
                if (playerWeapon === 'pistol') {
                    enemy.health -= 2;
                } else if (playerWeapon === 'shotgun') {
                    enemy.health -= 3;
                }

                // Remove the bullet
                bullets.splice(bulletIndex, 1);

                // Remove the enemy if health is 0 or below
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    playerCoins += 10; // Award coins for killing an enemy
                    updateHUD();

                    // Check if all enemies are defeated to start the next wave
                    if (enemies.length === 0) {
                        nextWave();
                    }
                }
            }
        });
    });

    enemies.forEach((enemy, enemyIndex) => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Reduce player health on collision
            player.health -= 10;
            updateHUD();

            // Remove the enemy
            enemies.splice(enemyIndex, 1);

            if (player.health <= 0) {
                endGame();
            }
        }
    });
}

// Function to shoot bullets
function shoot() {
    const bullet = {
        x: player.x,
        y: player.y,
        dx: Math.cos(player.angle),
        dy: Math.sin(player.angle)
    };

    bullets.push(bullet);
}

// Function to spawn enemies at the edges of the screen
function spawnEnemies() {
    for (let i = 0; i < ENEMY_SPAWN_RATE * waveNumber; i++) {
        // Randomly decide which edge to spawn the enemy on
        const edge = Math.floor(Math.random() * 4);

        let x, y;

        switch (edge) {
            case 0: // Top edge
                x = Math.random() * canvas.width;
                y = -ENEMY_SIZE;
                break;
            case 1: // Right edge
                x = canvas.width;
                y = Math.random() * canvas.height;
                break;
            case 2: // Bottom edge
                x = Math.random() * canvas.width;
                y = canvas.height;
                break;
            case 3: // Left edge
                x = -ENEMY_SIZE;
                y = Math.random() * canvas.height;
                break;
        }

        // Initialize each enemy with its own health
        const enemy = {
            x: x,
            y: y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE,
            health: 5 // Set the enemy's health to 5
        };

        enemies.push(enemy);
    }
}

// Function to update the HUD (score, health, currency)
function updateHUD() {
    document.getElementById('score').innerText = `Wave: ${waveNumber}`;
    document.getElementById('health').innerText = `HP: ${player.health}`;
    document.getElementById('currency').innerText = `Currency: ${playerCoins}`;
}

// Function to buy health upgrade
function buyHealthUpgrade() {
    if (playerCoins >= 50) {
        playerCoins -= 50;
        player.health += 50;
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

// Function to buy bullet speed upgrade
function buyBulletSpeedUpgrade() {
    if (playerCoins >= 100) {
        playerCoins -= 100;
        BULLET_SPEED += 2;
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

// Function to buy player speed upgrade
function buyPlayerSpeedUpgrade() {
    if (playerCoins >= 100) {
        playerCoins -= 100;
        player.speed += 2;
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

// Function to buy shotgun
function buyShotgun() {
    if (playerCoins >= 100) {
        playerCoins -= 100;
        playerWeapon = 'shotgun';
        document.getElementById('shotgunStatus').innerText = 'Purchased';
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
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
}

// Event listeners
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
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    player.angle = calculateAngleToMouse(e.clientX, e.clientY);
});

// Function to calculate the angle between the player and the mouse cursor
function calculateAngleToMouse(mouseX, mouseY) {
    const rect = canvas.getBoundingClientRect();
    const playerX = player.x - rect.left;
    const playerY = player.y - rect.top;
    return Math.atan2(mouseY - playerY, mouseX - playerX);
}

// Game loop
function gameLoop() {
    if (!gamePaused && !gameOver && !gameLoopRunning) {
        gameLoopRunning = true;
        requestAnimationFrame(loop);
    }
}

function loop() {
    if (!gamePaused && !gameOver) {
        clearCanvas();
        drawPlayer();
        drawBullets();
        drawEnemies();
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkCollisions();

        requestAnimationFrame(loop);
    }
}

// Start the game loop when the page loads
window.onload = () => {
    updateHUD();
    spawnEnemies();
    gameLoop();
};
