const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    hp: 100
};

let bullets = [];
let enemies = [];
let score = 0;
let currency = 0;
let wave = 1;
let gamePaused = false;

const pistol = {
    damage: 2,
    fireRate: 300,
    lastFired: 0
};

const shotgun = {
    damage: 3,
    fireRate: 600,
    pellets: 3,
    spread: Math.PI / 8,
    lastFired: 0,
    purchased: false
};

let currentWeapon = pistol;

function spawnEnemies(num) {
    for (let i = 0; i < num; i++) {
        let size = 50;
        let x = Math.random() > 0.5 ? 0 - size : canvas.width + size;
        let y = Math.random() > 0.5 ? 0 - size : canvas.height + size;

        let enemy = {
            x: x,
            y: y,
            width: size,
            height: size,
            speed: 1 + 0.1 * wave,
            dx: 0,
            dy: 0,
            hp: 5
        };
        enemies.push(enemy);
    }
}

function updatePlayerPosition() {
    player.x += player.dx;
    player.y += player.dy;

    // Ensure player stays within the canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
    enemies.forEach((enemy, index) => {
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Move enemy toward the player
        let angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.dx = Math.cos(angle) * enemy.speed;
        enemy.dy = Math.sin(angle) * enemy.speed;

        enemy.x += enemy.dx;
        enemy.y += enemy.dy;

        // Check for collision with player
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            player.hp -= 10;
            enemies.splice(index, 1); // Remove the enemy on collision
        }
    });
}

function shootBullet() {
    if (Date.now() - currentWeapon.lastFired > currentWeapon.fireRate) {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            width: 5,
            height: 5,
            dx: Math.cos(player.angle) * 10,
            dy: Math.sin(player.angle) * 10,
            damage: currentWeapon.damage
        });
        currentWeapon.lastFired = Date.now();
    }
}

function drawBullets() {
    bullets.forEach((bullet, index) => {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove bullets that leave the screen
        if (
            bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height
        ) {
            bullets.splice(index, 1);
        }

        // Check for collisions with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.hp -= bullet.damage;
                bullets.splice(index, 1); // Remove the bullet

                if (enemy.hp <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    currency += 5;
                }
            }
        });
    });
}

function update() {
    if (!gamePaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updatePlayerPosition();
        drawPlayer();
        drawEnemies();
        drawBullets();

        requestAnimationFrame(update);
    }
}

function startWave() {
    spawnEnemies(wave * 5); // Increase the number of enemies each wave
}

function gameLoop() {
    update();
    if (enemies.length === 0) {
        wave++;
        startWave();
    }
}

// Event listeners
document.addEventListener('keydown', function (e) {
    if (e.key === 'w') player.dy = -player.speed;
    if (e.key === 's') player.dy = player.speed;
    if (e.key === 'a') player.dx = -player.speed;
    if (e.key === 'd') player.dx = player.speed;
    if (e.key === ' ') shootBullet();

    if (e.key === 'Enter') {
        if (gamePaused) hideShop();
        else showShop();
    }
});

document.addEventListener('keyup', function (e) {
    if (e.key === 'w' || e.key === 's') player.dy = 0;
    if (e.key === 'a' || e.key === 'd') player.dx = 0;
});

// Start the first wave
startWave();
gameLoop();

// Shop functions
function showShop() {
    gamePaused = true;
    document.getElementById('shopContainer').style.display = 'flex';
}

function hideShop() {
    gamePaused = false;
    document.getElementById('shopContainer').style.display = 'none';
    gameLoop(); // Restart the game loop
}

function buyHealthUpgrade() {
    if (currency >= 50) {
        currency -= 50;
        player.hp += 50;
    }
}

function buyBulletSpeedUpgrade() {
    if (currency >= 50) {
        currency -= 50;
        currentWeapon.fireRate -= 50;
    }
}

function buyPlayerSpeedUpgrade() {
    if (currency >= 50) {
        currency -= 50;
        player.speed += 2;
    }
}

function buyShotgun() {
    if (currency >= 100) {
        currency -= 100;
        shotgun.purchased = true;
        currentWeapon = shotgun;
        document.getElementById('shotgunStatus').textContent = 'Purchased';
    }
}
