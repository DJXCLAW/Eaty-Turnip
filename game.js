// Define missing variables for the Maniac enemy
const MANIAC_SIZE = 64; // Example size for the Maniac
const MANIAC_SPEED = 1.5; // Example speed for the Maniac
const MANIAC_HEALTH = 20; // Example health for the Maniac
const MANIAC_SHOTGUN_FIRE_RATE = 1500; // Example fire rate for the Maniac
const MANIAC_DAMAGE = 15; // Example damage for the Maniac's bullets

// Merge the duplicate spawnEnemies functions
function spawnEnemies() {
    for (let i = 0; i < ENEMY_SPAWN_RATE * waveNumber; i++) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        switch (edge) {
            case 0: x = Math.random() * canvas.width; y = -ENEMY_SIZE; break;
            case 1: x = canvas.width; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height; break;
            case 3: x = -ENEMY_SIZE; y = Math.random() * canvas.height; break;
        }

        // Randomly assign enemy type (10% chance for Maniac, 50% for Shooter)
        const isManiac = Math.random() < 0.1;
        const isShooter = !isManiac && Math.random() < 0.5;
        
        const enemy = isManiac
            ? { ...MANIAC_TEMPLATE, x, y }
            : isShooter
                ? { ...SHOOTER_TEMPLATE, x, y }
                : { ...RAMMER_TEMPLATE, x, y };

        enemies.push(enemy);
    }
}

// Fix the bullet damage calculation for Sniper weapon in checkCollisions
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

    // Check if player collides with enemies
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

