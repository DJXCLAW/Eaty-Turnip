const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width = window.innerWidth;
const HEIGHT = canvas.height = window.innerHeight;

const PLAYER_SIZE = 32;
const BULLET_SIZE = 8;
const ENEMY_SIZE = 32;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_SPEED = 2;
const FIRE_RATE = 200; // milliseconds

let player = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    color: 'white'
};

let bullets = [];
let enemies = [];
let lastFireTime = 0;

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
    // Update player
    if (keys['w']) player.y -= PLAYER_SPEED;
    if (keys['s']) player.y += PLAYER_SPEED;
    if (keys['a']) player.x -= PLAYER_SPEED;
    if (keys['d']) player.x += PLAYER_SPEED;

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
        enemy.x += dx * ENEMY_SPEED;
        enemy.y += dy * ENEMY_SPEED;
    });

    // Collision detection
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
            }
        });
    });

    bullets = bullets.filter(bullet => !bullet.toRemove);
}

function draw() {
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

const keys = {};
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
        const angle = Math.atan2(player.y - mouse.y, player.x - mouse.x);
        bullets.push({
            x: player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            y: player.y + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            dx: Math.cos(angle) * BULLET_SPEED,
            dy: Math.sin(angle) * BULLET_SPEED
        });
    }
});

canvas.addEventListener('mousemove', (e) => {
    mouse = {
        x: e.clientX,
        y: e.clientY
    };
});

function spawnEnemies() {
    for (let i = 0; i < 5; i++) {
        enemies.push(createEnemy());
    }
}
spawnEnemies();

gameLoop();
