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
    if (gameOver) return;

    // Update player
    if (keys['w']) player.y -= playerSpeed;
    if (keys['s']) player.y += playerSpeed;
    if (keys['a']) player.x -= playerSpeed;
    if (keys['d']) player.x += playerSpeed;

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

    checkWaveComplete();
}

function draw() {
    if (gameOver) return;

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
    requestAnimationFrame(gameLoop);
}

function spawnEnemies() {
    enemies = [];
    const enemyCount = 5 + wave * 3; // Increase number of enemies per wave
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(createEnemy());
    }
}

function checkWaveComplete() {
    if (enemies.length === 0) {
        wave++;
        spawnEnemies();
        spawnRate = Math.max(1000, spawnRate - 100); // Increase spawn rate
    }
}

function endGame() {
    gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('score').style.display = 'none';
    document.getElementById('health').style.display = 'none';
    document.getElementById('currency').style.display = 'none';
    document.getElementById('shop').style.display = 'none';
}

function buyHealthUpgrade() {
    if (currency >= 50) {
        player.hp = Math.min(player.hp + 50, PLAYER_MAX_HP);
        currency -= 50;
        document.getElementById('health').textContent = `HP: ${player.hp}`;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
    }
}

function buyBulletSpeedUpgrade() {
    if (currency >= 20) {
        bulletSpeed += 2;
        currency -= 20;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
    }
}

function buyPlayerSpeedUpgrade() {
    if (currency >= 30) {
        playerSpeed += 2;
        currency -= 30;
        document.getElementById('currency').textContent = `Currency: ${currency}`;
    }
}

function showShop() {
    if (gameOver) return;
    document.getElementById('shop').style.display = 'block';
}

function hideShop() {
    document.getElementById('shop').style.display = 'none';
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.addEventListener('mousedown', () => {
    const now = Date.now();
    if (now - lastFireTime > FIRE_RATE) {
        lastFireTime = now;
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        bullets.push({
            x: player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            y: player.y + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            dx: Math.cos(angle) * bulletSpeed,
            dy: Math.sin(angle) * bulletSpeed
        });
    }
});

canvas.addEventListener('mousemove', (e) => {
    mouse = {
        x: e.clientX,
        y: e.clientY
    };
});

let keys = {};
let mouse = { x: WIDTH / 2, y: HEIGHT / 2 };

gameLoop();