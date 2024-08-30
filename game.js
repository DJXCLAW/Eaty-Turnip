const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width = window.innerWidth;
const HEIGHT = canvas.height = window.innerHeight;

const PLAYER_SIZE = 32;
const BULLET_SIZE = 8;
const ENEMY_SIZE = 32;
const BASE_PLAYER_SPEED = 5;
const BASE_BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 2;
const FIRE_RATE = 200; // milliseconds
const PLAYER_MAX_HP = 100;
const DAMAGE_AMOUNT = 10; // Damage per enemy collision
const INITIAL_CURRENCY = 0;

let player = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    color: 'white',
    hp: PLAYER_MAX_HP,
    speed: BASE_PLAYER_SPEED
};

let bullets = [];
let enemies = [];
let lastFireTime = 0;
let score = 0;
let wave = 0;
let spawnRate = 3000; // milliseconds
let currency = INITIAL_CURRENCY;
let bulletSpeed = BASE_BULLET_SPEED;
let playerSpeed = BASE_PLAYER_SPEED;
let enemySpeed = BASE_ENEMY_SPEED;

let gameOver = false;
let gamePaused = false;
let animationFrameId = null; // Track the animation frame

function createEnemy() {
    return {
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        width: ENEMY_SIZE,
        height: ENEMY_SIZE,
        color: 'red'
    };
}

function update() {
    if (gameOver || gamePaused) return;  // Halt all updates if the game is over or paused

    // Update player movement with boundary checks
    if (keys['w'] && player.y > 0) player.y -= playerSpeed;
    if (keys['s'] && player.y < HEIGHT - PLAYER_SIZE) player.y += playerSpeed;
    if (keys['a'] && player.x > 0) player.x -= playerSpeed;
    if (keys['d'] && player.x < WIDTH - PLAYER_SIZE) player.x += playerSpeed;

    // Ensure the player does not move out of bounds
    if (player.x < 0) player.x = 0;
    if (player.x > WIDTH - PLAYER_SIZE) player.x = WIDTH - PLAYER_SIZE;
    if (player.y < 0) player.y = 0;
    if (player.y > HEIGHT - PLAYER_SIZE) player.y = HEIGHT - PLAYER_SIZE;

    // Update bullets
    bullets.forEach(bullet => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
    });

    bullets = bullets.filter(bullet => bullet.x > 0 && bullet.x < WIDTH && bullet.y > 0 && bullet.y < HEIGHT);

    // Update enemies
    enemies.forEach(enemy => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        dx /= dist;
        dy /= dist;
        enemy.x += dx * enemySpeed;
        enemy.y += dy * enemySpeed;
    });

    // Collision detection for bullets and enemies
    bullets.forEach(bullet => {
        enemies.forEach((enemy, index) => {
            if (
                bullet.x < enemy.x + ENEMY_SIZE &&
                bullet.x + BULLET_SIZE > enemy.x &&
                bullet.y < enemy.y + ENEMY_SIZE &&
                bullet.y + BULLET_SIZE > enemy.y
            ) {
                enemies.splice(index, 1);
                bullet.toRemove = true;
                score += 10; // Increase score
                currency += 5; // Increase currency
                document.getElementById('score').textContent = `Score: ${score}`;
                document.getElementById('currency').textContent = `Currency: ${currency}`;
            }
        });
    });

    bullets = bullets.filter(bullet => !bullet.toRemove);

    // Collision detection for enemies and player
    enemies.forEach((enemy, index) => {
        if (
            player.x < enemy.x + ENEMY_SIZE &&
            player.x + PLAYER_SIZE > enemy.x &&
            player.y < enemy.y + ENEMY_SIZE &&
            player.y + PLAYER_SIZE > enemy.y
        ) {
            // Reduce player's health
            player.hp -= DAMAGE_AMOUNT;
            document.getElementById('health').textContent = `HP: ${player.hp}`;

            // Remove the enemy
            enemies.splice(index, 1);

            if (player.hp <= 0) {
                endGame();
            }
        }
    });
}

 // Update player
    if (keys['w'] && player.y > 0) player.y -= playerSpeed;
   
function draw() {
    if (gameOver || gamePaused) return;  // Halt all drawing if the game is over or paused

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function gameLoop() {
    update();
    draw();
    if (!gameOver && !gamePaused) {
        animationFrameId = requestAnimationFrame(gameLoop);  // Only continue the loop if not paused or game over
    }
}

function spawnEnemies() {
    enemies = [];
    const enemyCount = 5 + wave * 3; // Increase number of enemies per wave
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(createEnemy());
    }
}

const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.addEventListener('mousedown', () => {
    if (gamePaused || gameOver) return;  // Prevent shooting when game is paused or over

    const now = Date.now();
    if (now - lastFireTime > FIRE_RATE) {
        lastFireTime = now;
        const dx = mouse.x - (player.x + PLAYER_SIZE / 2);
        const dy = mouse.y - (player.y + PLAYER_SIZE / 2);
        const magnitude = Math.sqrt(dx * dx + dy * dy); // Calculate magnitude
        bullets.push({
            x: player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            y: player.y + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            dx: (dx / magnitude) * bulletSpeed, // Bullet speed in x direction
            dy: (dy / magnitude) * bulletSpeed  // Bullet speed in y direction
        });
    }
});

const mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function endGame() {
    gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
}

function startGame() {
    gameOver = false;
    gamePaused = false;
    player.hp = PLAYER_MAX_HP;
    player.x = WIDTH / 2;
    player.y = HEIGHT / 2;
    score = 0;
    currency = INITIAL_CURRENCY;
    document.getElementById('health').textContent = `HP: ${PLAYER_MAX_HP}`;
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('currency').textContent = 'Currency: 0';
    document.getElementById('gameOver').style.display = 'none';
    spawnEnemies();
    gameLoop();
}

function showShop() {
    gamePaused = true;  // Pause the game when the shop is shown
    document.getElementById('shop').style.display = 'block';
    cancelAnimationFrame(animationFrameId);  // Stop the game loop
}

function hideShop() {
    gamePaused = false;  // Unpause the game when the shop is hidden
    document.getElementById('shop').style.display = 'none';
    gameLoop();  // Resume the game loop
}

function buyHealthUpgrade() {
    if (currency >= 50) {
        player.hp += 50;
        currency -= 50;
        document.getElementById('health').textContent = `HP: ${player.hp}`;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
    }
}

function buyBulletSpeedUpgrade() {
    if (currency >= 50) {
        bulletSpeed += 2;
        currency -= 50;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
    }
}

function buyPlayerSpeedUpgrade() {
    if (currency >= 50) {
        playerSpeed += 2;
        currency -= 50;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
    }
}

function buyShotgun() {
    if (currency >= 100) {
        // Implement shotgun purchase logic
        currency -= 100;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
        // TODO: Implement shotgun firing mode in update loop
    }
}

startGame();
