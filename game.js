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
const BASE_ENEMY_SPEED = 1; // Enemies move slower towards the player
const DAMAGE_AMOUNT = 10; // Amount of damage player takes from an enemy hit
let playerCoins = 0;
let playerHp = 100;

// Weapons array with purchase status
let weapons = [
    { name: 'pistol', fireRate: 200, damage: 2, purchased: true }, // Pistol is always available
    { name: 'shotgun', fireRate: 500, damage: 3, spread: true, purchased: false } // Shotgun needs to be purchased
];
let currentWeaponIndex = 0; // Start with the first weapon in the list
let playerWeapon = weapons[currentWeaponIndex].name;

let player = {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: canvas.height - PLAYER_SIZE * 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: BASE_PLAYER_SPEED,
    hp: playerHp,
    angle: 0 // Player's rotation angle (in radians)
};

let bullets = [];
let enemies = [];
let lastFireTime = 0;
let waveNumber = 1; // Start at wave 1
const ENEMY_SPAWN_RATE = 5; // Number of enemies per wave

let gamePaused = false; // Add a gamePaused variable to handle pause/resume
let gameOver = false; // Add a gameOver variable to handle game over state
let gameLoopRunning = false; // Track whether the game loop is running

// Key handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        shoot();
    }

    // Rotate weapons with 'q' and 'e'
    if (e.key === 'q' || e.key === 'e') {
        let increment = e.key === 'q' ? -1 : 1;
        do {
            currentWeaponIndex = (currentWeaponIndex + increment + weapons.length) % weapons.length;
        } while (!weapons[currentWeaponIndex].purchased); // Skip weapons that haven't been purchased

        playerWeapon = weapons[currentWeaponIndex].name;
        updateHUD();
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

// Update the HUD elements
function updateHUD() {
    document.getElementById('score').innerText = `Score: ${waveNumber * 100}`;
    document.getElementById('health').innerText = `HP: ${player.hp}`;
    document.getElementById('currency').innerText = `Currency: ${playerCoins}`;
    document.getElementById('currentWeapon').innerText = `Weapon: ${weapons[currentWeaponIndex].name}`;
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
    if (keys['a'] || keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['d'] || keys['ArrowRight'] && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    if (keys['w'] || keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['s'] || keys['ArrowDown'] && player.y + player.height < canvas.height) {
        player.y += player.speed;
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
        // Calculate direction vector from enemy to player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction and move the enemy towards the player
        enemy.x += (dx / distance) * BASE_ENEMY_SPEED;
        enemy.y += (dy / distance) * BASE_ENEMY_SPEED;
    });
}

// Function to detect collisions between bullets and enemies
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + BULLET_SIZE > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + BULLET_SIZE > enemy.y) {

                // Apply damage based on weapon type
                let damage = weapons[currentWeaponIndex].damage;
                enemy.health -= damage;

                // Remove the bullet after it hits
                bullets.splice(bulletIndex, 1);

                // If the enemy's health is 0 or below, remove it
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    // Increase the player's score and coins
                    playerCoins += 10;
                    updateHUD();
                }
            }
        });
    });

    // Check for collisions between the player and enemies
    enemies.forEach((enemy, enemyIndex) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            // Player takes damage
            player.hp -= DAMAGE_AMOUNT;
            updateHUD();

            // Remove the enemy after collision
            enemies.splice(enemyIndex, 1);

            // Check if the player's HP has reached zero
            if (player.hp <= 0) {
                endGame(); // End the game
            }
        }
    });

    // Check if all enemies are defeated
    if (enemies.length === 0 && !gameOver) {
        nextWave(); // Start the next wave
    }
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

// Function to calculate the angle between the player and the mouse cursor
function calculateAngleToMouse(mouseX, mouseY) {
    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    return Math.atan2(dy, dx);
}

// Function to handle shooting
function shoot() {
    const now = Date.now();
    let currentWeapon = weapons[currentWeaponIndex];
    let fireRate = currentWeapon.fireRate;

    if (now - lastFireTime >= fireRate) {
        const bulletSpeed = BASE_BULLET_SPEED;

        // Create a new bullet
        const bullet = {
            x: player.x + player.width / 2 - BULLET_SIZE / 2,
            y: player.y + player.height / 2 - BULLET_SIZE / 2,
            vx: Math.cos(player.angle) * bulletSpeed,
            vy: Math.sin(player.angle) * bulletSpeed
        };

        bullets.push(bullet);

        if (currentWeapon.spread) {
            // Add two more bullets with spread
            const spreadAngle = Math.PI / 12; // 15 degrees

            const bulletLeft = {
                x: bullet.x,
                y: bullet.y,
                vx: Math.cos(player.angle - spreadAngle) * bulletSpeed,
                vy: Math.sin(player.angle - spreadAngle) * bulletSpeed
            };

            const bulletRight = {
                x: bullet.x,
                y: bullet.y,
                vx: Math.cos(player.angle + spreadAngle) * bulletSpeed,
                vy: Math.sin(player.angle + spreadAngle) * bulletSpeed
            };

            bullets.push(bulletLeft, bulletRight);
        }

        lastFireTime = now;
    }
}

// Function to start the next wave
function nextWave() {
    waveNumber++;
    spawnEnemies();
    updateHUD(); // Update the HUD with the new wave number
}

// Function to show the shop
function showShop() {
    const shopContainer = document.getElementById('shopContainer');
    shopContainer.style.display = 'flex';
    gamePaused = true; // Pause the game when the shop is open
}

// Function to hide the shop
function hideShop() {
    const shopContainer = document.getElementById('shopContainer');
    shopContainer.style.display = 'none';
    gamePaused = false; // Resume the game when the shop is closed
}

function buyShotgun() {
    if (playerCoins >= 100 && !weapons[1].purchased) { // Ensure shotgun is not already purchased
        playerCoins -= 100;
        weapons[1].purchased = true; // Mark shotgun as purchased
        document.getElementById('shotgunStatus').innerText = 'Purchased';
        updateHUD();
    } else if (weapons[1].purchased) {
        alert("Shotgun already purchased!");
    } else {
        alert("Not enough coins!");
    }
}


// Function to handle game over
function endGame() {
    gameOver = true;
    alert("Game Over!");
    // Optionally, stop the game loop here or reset the game state
}

// Main game loop
function gameLoop() {
    if (gameOver) return; // Stop the game loop if the game is over
    if (!gamePaused) {
        clearCanvas();
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkCollisions();
        drawPlayer();
        drawBullets();
        drawEnemies();
    }

    requestAnimationFrame(gameLoop);
}

// Function to start the game loop
function startGame() {
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

// Start the game when the page loads
window.onload = startGame;
