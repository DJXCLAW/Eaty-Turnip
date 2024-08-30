document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

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

    // Shotgun variables
    let hasShotgun = false;
    const SHOTGUN_COST = 150;
    const SHOTGUN_FIRE_RATE = 600; // Slower cooldown in milliseconds
    const SHOTGUN_BULLET_SPREAD = 0.2; // Spread angle in radians
    const SHOTGUN_BULLETS = 5; // Number of bullets per shot

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
    let mouse = { x: 0, y: 0 };

    // Initialize wave display
    document.getElementById('wave').textContent = `Wave: ${wave}`;

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
        if (keys['w']) player.y = Math.max(0, player.y - playerSpeed);
        if (keys['s']) player.y = Math.min(HEIGHT - PLAYER_SIZE, player.y + playerSpeed);
        if (keys['a']) player.x = Math.max(0, player.x - playerSpeed);
        if (keys['d']) player.x = Math.min(WIDTH - PLAYER_SIZE, player.x + playerSpeed);

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

            // Ensure enemies stay within bounds
            enemy.x = Math.max(0, Math.min(WIDTH - ENEMY_SIZE, enemy.x));
            enemy.y = Math.max(0, Math.min(HEIGHT - ENEMY_SIZE, enemy.y));
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

        // Debug: Draw a simple shape to verify rendering
        ctx.fillStyle = 'blue';
        ctx.fillRect(50, 50, 100, 100);
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
            document.getElementById('wave').textContent = `Wave: ${wave}`;
            spawnRate = Math.max(500, spawnRate - 100); // Increase spawn rate
        }
    }

    function endGame() {
        gameOver = true;
        document.getElementById('gameOver').style.display = 'block';
    }

    function showShop() {
        document.getElementById('shop').style.display = 'block';
    }

    function hideShop() {
        document.getElementById('shop').style.display = 'none';
    }

    function buyHealthUpgrade() {
        if (currency >= 50) {
            player.hp = Math.min(PLAYER_MAX_HP, player.hp + 50);
            currency -= 50;
            document.getElementById('health').textContent = `HP: ${player.hp}`;
            document.getElementById('currency').textContent = `Currency: ${currency}`;
        } else {
            alert('Not enough currency!');
        }
    }

    function buyBulletSpeedUpgrade() {
        if (currency >= 30) {
            bulletSpeed += 2;
            currency -= 30;
            document.getElementById('currency').textContent = `Currency: ${currency}`;
        } else {
            alert('Not enough currency!');
        }
    }

    function buyPlayerSpeedUpgrade() {
        if (currency >= 40) {
            playerSpeed += 2;
            currency -= 40;
            document.getElementById('currency').textContent = `Currency: ${currency}`;
        } else {
            alert('Not enough currency!');
        }
    }

    function buyShotgun() {
        if (currency >= SHOTGUN_COST) {
            hasShotgun = true;
            currency -= SHOTGUN_COST;
            document.getElementById('currency').textContent = `Currency: ${currency}`;
            document.getElementById('shop').style.display = 'none'; // Close shop after purchase
        } else {
            alert('Not enough currency!');
        }
    }

    function fireBullet() {
        if (gameOver) return;
        const now = Date.now();
        if (now - lastFireTime < (hasShotgun ? SHOTGUN_FIRE_RATE : FIRE_RATE)) return;

        lastFireTime = now;

        const dx = mouse.x - player.x;
        const dy = mouse.y - player.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const directionX = dx / length;
        const directionY = dy / length;

        if (hasShotgun) {
            for (let i = 0; i < SHOTGUN_BULLETS; i++) {
                const angle = (Math.random() - 0.5) * SHOTGUN_BULLET_SPREAD;
                bullets.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    dx: directionX * bulletSpeed * Math.cos(angle),
                    dy: directionY * bulletSpeed * Math.sin(angle),
                    toRemove: false
                });
            }
        } else {
            bullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                dx: directionX * bulletSpeed,
                dy: directionY * bulletSpeed,
                toRemove: false
            });
        }
    }

    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.code === 'Space') {
            fireBullet();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    document.getElementById('shopButton').addEventListener('click', showShop);
    document.getElementById('closeShopButton').addEventListener('click', hideShop);
    document.getElementById('buyHealth').addEventListener('click', buyHealthUpgrade);
    document.getElementById('buyBulletSpeed').addEventListener('click', buyBulletSpeedUpgrade);
    document.getElementById('buyPlayerSpeed').addEventListener('click', buyPlayerSpeedUpgrade);
    document.getElementById('buyShotgun').addEventListener('click', buyShotgun);

    gameLoop();
    spawnEnemies();
});
