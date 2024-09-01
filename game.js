const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    color: "blue",
    speed: 5,
    hp: 100
};

let bullets = [];
let enemies = [];
let score = 0;
let currency = 0;
let gamePaused = false;
let waveNumber = 1;

let currentWeapon = 'pistol';
let shotgunPurchased = false;

document.addEventListener("keydown", function(event) {
    if (event.code === "Enter") {
        showShop();
    }
    if (event.code === "Space") {
        shoot();
    }
});

function switchWeapon() {
    if (shotgunPurchased) {
        currentWeapon = (currentWeapon === 'pistol') ? 'shotgun' : 'pistol';
        console.log(`Switched to ${currentWeapon}`);
    } else {
        console.log("Shotgun not purchased yet.");
    }
}

function buyShotgun() {
    if (currency >= 100) {
        shotgunPurchased = true;
        currency -= 100;
        document.getElementById('shotgunStatus').innerText = 'Purchased';
        console.log("Shotgun purchased!");
    } else {
        console.log("Not enough currency to buy the shotgun.");
    }
}

function shoot() {
    if (currentWeapon === 'pistol') {
        fireBullet(player.x, player.y, mouseAngle, 2);
    } else if (currentWeapon === 'shotgun') {
        fireShotgun(player.x, player.y, mouseAngle);
    }
}

function fireShotgun(x, y, angle) {
    let spreadAngle = 0.1;
    fireBullet(x, y, angle - spreadAngle, 3);
    fireBullet(x, y, angle, 3);
    fireBullet(x, y, angle + spreadAngle, 3);
}

function fireBullet(x, y, angle, damage) {
    bullets.push({
        x: x,
        y: y,
        angle: angle,
        speed: 10,
        damage: damage
    });
}

function spawnEnemy() {
    let side = Math.floor(Math.random() * 4);
    let enemy = {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        color: "red",
        speed: 1 + waveNumber * 0.5,
        hp: 5,
        damage: 10
    };

    if (side === 0) { // Top
        enemy.x = Math.random() * canvas.width;
        enemy.y = -enemy.height;
    } else if (side === 1) { // Bottom
        enemy.x = Math.random() * canvas.width;
        enemy.y = canvas.height;
    } else if (side === 2) { // Left
        enemy.x = -enemy.width;
        enemy.y = Math.random() * canvas.height;
    } else if (side === 3) { // Right
        enemy.x = canvas.width;
        enemy.y = Math.random() * canvas.height;
    }

    enemies.push(enemy);
}

function update() {
    if (gamePaused) return;

    // Move player
    if (keys["KeyW"]) player.y -= player.speed;
    if (keys["KeyS"]) player.y += player.speed;
    if (keys["KeyA"]) player.x -= player.speed;
    if (keys["KeyD"]) player.x += player.speed;

    // Constrain player within canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;

        // Remove bullets out of bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    // Update enemies
    enemies.forEach((enemy, index) => {
        let angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Check for collision with player
        if (isColliding(player, enemy)) {
            player.hp -= enemy.damage;
            enemies.splice(index, 1);

            if (player.hp <= 0) {
                gameOver();
            }
        }

        // Check for collision with bullets
        bullets.forEach((bullet, bulletIndex) => {
            if (isColliding(bullet, enemy)) {
                enemy.hp -= bullet.damage;
                bullets.splice(bulletIndex, 1);

                if (enemy.hp <= 0) {
                    score += 10;
                    currency += 5;
                    enemies.splice(index, 1);
                }
            }
        });
    });

    // If all enemies are dead, start next wave
    if (enemies.length === 0) {
        waveNumber++;
        for (let i = 0; i < waveNumber * 2; i++) {
            spawnEnemy();
        }
    }

    // Render everything
    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw HUD
    document.getElementById("score").innerText = `Score: ${score}`;
    document.getElementById("health").innerText = `HP: ${player.hp}`;
    document.getElementById("currency").innerText = `Currency: ${currency}`;
}

function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameOver() {
    gamePaused = true;
    document.getElementById("gameOver").style.display = "block";
}

const keys = {};
document.addEventListener("keydown", function(event) {
    keys[event.code] = true;
});

document.addEventListener("keyup", function(event) {
    keys[event.code] = false;
});

canvas.addEventListener("mousemove", function(event) {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    mouseAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

gameLoop();
