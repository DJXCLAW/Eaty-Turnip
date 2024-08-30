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
let playerCoins = 0;
let playerWeapon = 'pistol'; // Start with a basic pistol
let playerHp = 100;

let player = {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: canvas.height - PLAYER_SIZE * 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: BASE_PLAYER_SPEED,
    hp: playerHp
};

let bullets = [];
let enemies = [];
let lastFireTime = 0;
let waveNumber = 1; // Start at wave 1
const FIRE_RATE = 200; // Milliseconds for pistol
const SHOTGUN_FIRE_RATE = 500; // Milliseconds for shotgun
const ENEMY_SPAWN_RATE = 5; // Number of enemies per wave

// Shop items
const shopItems = {
    shotgun: { cost: 100, fireRate: SHOTGUN_FIRE_RATE, bulletsPerShot: 3 },
    heal: { cost: 50, healAmount: 50 }
};

// Helper function to clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to draw the player
function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
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
    if (keys['a'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['d'] && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    if (keys['w'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['s'] && player.y + player.height < canvas.height) {
        player.y += player.speed;
    }
}

// Function to update the bullets' positions
function updateBullets() {
    bullets = bullets.filter(bullet => bullet.y > 0);
    bullets.forEach(bullet => {
        bullet.y -= BASE_BULLET_SPEED;
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

        enemies.push({
            x: x,
            y: y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE
        });
    }
}

// Handle shooting
function shoot() {
    const now = Date.now();
    let fireRate = playerWeapon === 'shotgun' ? SHOTGUN_FIRE_RATE : FIRE_RATE;

    if (now - lastFireTime > fireRate) {
        if (playerWeapon === 'shotgun') {
            // Shotgun fires multiple bullets at once
            for (let i = -1; i <= 1; i++) {
                bullets.push({
                    x: player.x + player.width / 2 - BULLET_SIZE / 2 + i * BULLET_SIZE * 1.5,
                    y: player.y,
                    width: BULLET_SIZE,
                    height: BULLET_SIZE
                });
            }
        } else {
            // Pistol fires a single bullet
            bullets.push({
                x: player.x + player.width / 2 - BULLET_SIZE / 2,
                y: player.y,
                width: BULLET_SIZE,
                height: BULLET_SIZE
            });
        }
        lastFireTime = now;
    }
}

// Function to open the shop
function openShop() {
    // Display the shop menu (this can be a simple alert for now)
    const choice = prompt(`Shop:\n1. Shotgun - ${shopItems.shotgun.cost} coins\n2. Heal - ${shopItems.heal.cost} coins\nYour Coins: ${playerCoins}\nEnter the number of the item you want to buy:`, "");

    if (choice === '1' && playerCoins >= shopItems.shotgun.cost) {
        playerCoins -= shopItems.shotgun.cost;
        playerWeapon = 'shotgun';
        alert("You bought a shotgun!");
    } else if (choice === '2' && playerCoins >= shopItems.heal.cost) {
        playerCoins -= shopItems.heal.cost;
        player.hp = Math.min(player.hp + shopItems.heal.healAmount, playerHp);
        alert("You healed yourself!");
    } else {
        alert("Not enough coins or invalid choice.");
    }
}

// Track pressed keys
let keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        shoot();
    }
    if (e.key === 'Enter') {
        openShop(); // Press 'Enter' to open the shop
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Main game loop
function gameLoop() {
    clearCanvas();     // Clear the canvas
    updatePlayer();    // Update player's position
    updateBullets();   // Update bullets' positions
    updateEnemies();   // Update enemies' positions
    drawPlayer();      // Draw the player
    drawBullets();     // Draw bullets
    drawEnemies();     // Draw enemies

    requestAnimationFrame(gameLoop);  // Call gameLoop again
}

// Start the game with the first wave
function startGame() {
    spawnEnemies(); // Spawn the first wave of enemies
    gameLoop();     // Start the game loop
}

// Increase the wave number and spawn new enemies after a short delay
function nextWave() {
    waveNumber++;
    playerCoins += 50 * waveNumber; // Reward the player with coins after each wave
    setTimeout(() => {
        spawnEnemies();
    }, 1000); // Delay between waves
}

// Start the game
startGame();
