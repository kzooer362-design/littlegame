class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.stats = loadStats();
        this.currentLevel = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.gameLoop = null;
        
        this.player = {
            x: 0,
            y: 0,
            width: 120,
            height: 168,
            mouth: { x: 0, y: 0, radius: 30 },
            emotion: 'normal',
            moveSpeed: 8,
            direction: 0
        };
        
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.foods = [];
        this.bites = 0;
        this.timeLeft = 0;
        this.startTime = 0;
        
        // 人物美术资源
        this.playerSprites = {
            idle: null,
            open: null,
            happy: null,
            loaded: false
        };
        
        this.initUI();
        this.resizeCanvas();
        this.loadPlayerSprites();
        
        // 初始化并预加载音效
        audioManager.init();
        audioManager.loadExternalSounds();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    // 加载人物美术资源
    loadPlayerSprites() {
        const spritePaths = {
            idle: 'assets/sprites/player/player_idle.png',
            open: 'assets/sprites/player/player_open.png',
            happy: 'assets/sprites/player/player_happy.png'
        };
        
        let loadedCount = 0;
        const totalSprites = Object.keys(spritePaths).length;
        
        for (const [key, path] of Object.entries(spritePaths)) {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalSprites) {
                    this.playerSprites.loaded = true;
                    console.log('人物美术资源加载完成');
                }
            };
            img.onerror = () => {
                console.log(`人物资源 ${path} 未找到，使用默认绘制`);
                loadedCount++;
                if (loadedCount === totalSprites) {
                    this.playerSprites.loaded = true;
                }
            };
            img.src = path;
            this.playerSprites[key] = img;
        }
    }

    initUI() {
        this.updateMenuStats();
        
        document.getElementById('startBtn').addEventListener('click', () => { audioManager.playClick(); audioManager.playBGM(); this.showLevelSelect(); });
        document.getElementById('galleryBtn').addEventListener('click', () => { audioManager.playClick(); this.showGallery(); });
        document.getElementById('achievementsBtn').addEventListener('click', () => { audioManager.playClick(); this.showAchievements(); });
        document.getElementById('backToMenu').addEventListener('click', () => { audioManager.playClick(); this.showMenu(); });
        document.getElementById('pauseBtn').addEventListener('click', () => { audioManager.playClick(); this.togglePause(); });
        document.getElementById('resumeBtn').addEventListener('click', () => { audioManager.playClick(); this.togglePause(); });
        document.getElementById('restartLevelBtn').addEventListener('click', () => { audioManager.playClick(); this.restartLevel(); });
        document.getElementById('quitToMenuBtn').addEventListener('click', () => { audioManager.playClick(); this.quitToMenu(); });
        document.getElementById('nextLevelBtn').addEventListener('click', () => { audioManager.playClick(); this.nextLevel(); });
        document.getElementById('replayBtn').addEventListener('click', () => { audioManager.playClick(); this.restartLevel(); });
        document.getElementById('backToLevelsBtn').addEventListener('click', () => { audioManager.playClick(); this.showLevelSelect(); });
        document.getElementById('galleryBackBtn').addEventListener('click', () => { audioManager.playClick(); this.showMenu(); });
        document.getElementById('achievementsBackBtn').addEventListener('click', () => { audioManager.playClick(); this.showMenu(); });
        document.getElementById('resetBtn').addEventListener('click', () => { audioManager.playClick(); this.resetGame(); });

        document.getElementById('soundBtn').addEventListener('click', () => {
            audioManager.setEnabled(!audioManager.enabled);
            document.getElementById('soundBtn').textContent = audioManager.enabled ? '🔊' : '🔇';
            if (audioManager.enabled && !audioManager.bgmPlaying) {
                audioManager.playBGM();
            }
        });
        
        // BGM音量控制
        document.getElementById('bgmVolume').addEventListener('input', (e) => {
            audioManager.setBgmVolume(parseFloat(e.target.value));
        });
        
        // 音效音量控制
        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            audioManager.setSfxVolume(parseFloat(e.target.value));
        });
        
        // 点击游戏区域获得焦点
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
        
        // 添加tabindex让canvas可以获得焦点
        this.canvas.setAttribute('tabindex', '0');
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isPlaying && !this.isPaused) {
                e.preventDefault();
                e.stopPropagation();
                this.tryEat();
            }
            if (e.code === 'Escape' && this.isPlaying) {
                this.togglePause();
            }
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                this.keys[e.code] = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                this.keys[e.code] = false;
            }
        });
        
        this.canvas.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isPlaying && !this.isPaused) {
                e.preventDefault();
                e.stopPropagation();
                this.tryEat();
            }
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                this.keys[e.code] = true;
            }
        });
        
        this.canvas.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                this.keys[e.code] = false;
            }
        });
    }

    updateMenuStats() {
        document.getElementById('totalScore').textContent = this.stats.totalScore;
        document.getElementById('completedLevels').textContent = this.stats.completedLevels;
        document.getElementById('achievementCount').textContent = this.stats.unlockedAchievements.length;
    }

    resizeCanvas() {
        const container = document.querySelector('.game-area');
        this.canvas.width = Math.min(600, container.clientWidth - 40);
        this.canvas.height = 450;
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height - this.player.height - 30;
        this.player.mouth.x = this.player.x + this.player.width / 2;
        this.player.mouth.y = this.player.y + 60;
    }

    showMenu() {
        this.hideAll();
        document.getElementById('menu').classList.remove('hidden');
        // BGM需要用户交互后才能播放，不在此处直接调用
    }

    resetGame() {
        if (confirm('确定要重置游戏吗？所有进度将被清除！')) {
            this.stats = getDefaultStats();
            saveStats(this.stats);
            this.updateMenuStats();
            alert('游戏已重置！');
        }
    }

    showLevelSelect() {
        this.hideAll();
        document.getElementById('levelSelect').classList.remove('hidden');
        this.renderLevelGrid();
    }

    renderLevelGrid() {
        const grid = document.getElementById('levelsGrid');
        grid.innerHTML = '';
        
        LEVELS.forEach((level, index) => {
            const btn = document.createElement('button');
            btn.className = `level-btn ${index < this.stats.unlockedLevels ? 'unlocked' : 'locked'}`;
            if (index + 1 === this.currentLevel) btn.classList.add('current');
            
            btn.innerHTML = `
                ${index + 1}
                <div class="level-stars">${this.getLevelStars(index + 1)}</div>
            `;
            
            if (index < this.stats.unlockedLevels) {
                btn.addEventListener('click', () => { audioManager.playClick(); this.startLevel(index + 1); });
            }
            
            grid.appendChild(btn);
        });
    }

    getLevelStars(levelId) {
        const stars = this.stats.levelStars[levelId] || 0;
        return '⭐'.repeat(stars);
    }

    showGallery() {
        this.hideAll();
        document.getElementById('gallery').classList.remove('hidden');
        this.renderGallery();
    }

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = '';
        
        LEVELS.forEach((level, index) => {
            const item = document.createElement('div');
            item.className = `gallery-item ${index < this.stats.unlockedLevels ? 'unlocked' : 'locked'}`;
            if (index < this.stats.unlockedLevels) {
                item.textContent = level.emoji;
            }
            grid.appendChild(item);
        });
    }

    showAchievements() {
        this.hideAll();
        document.getElementById('achievements').classList.remove('hidden');
        this.renderAchievements();
    }

    renderAchievements() {
        const list = document.getElementById('achievementsList');
        list.innerHTML = '';
        
        ACHIEVEMENTS.forEach(achievement => {
            const unlocked = this.stats.unlockedAchievements.includes(achievement.id);
            const item = document.createElement('div');
            item.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="achievement-icon">${unlocked ? achievement.icon : '🔒'}</div>
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            `;
            list.appendChild(item);
        });
    }

    hideAll() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('levelSelect').classList.add('hidden');
        document.getElementById('game').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('levelResult').classList.add('hidden');
        document.getElementById('gallery').classList.add('hidden');
        document.getElementById('achievements').classList.add('hidden');
    }

    startLevel(levelId) {
        this.currentLevel = levelId;
        const level = LEVELS[levelId - 1];
        
        this.hideAll();
        document.getElementById('game').classList.remove('hidden');
        
        this.bites = 0;
        this.timeLeft = level.timeLimit;
        this.startTime = Date.now();
        this.isPlaying = true;
        this.isPaused = false;
        this.foods = [];
        
        document.getElementById('currentLevel').textContent = levelId;
        document.getElementById('progressText').textContent = `0/${level.bites}`;
        document.getElementById('timerText').textContent = `${level.timeLimit}s`;
        
        this.canvas.style.background = level.bgGradient;
        this.updateProgress();
        
        this.spawnFoods();
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);
        
        audioManager.playBGM();
        
        // 确保游戏区域获得焦点
        setTimeout(() => {
            this.canvas.focus();
        }, 100);
    }

    spawnFoods() {
        const level = LEVELS[this.currentLevel - 1];
        this.foods = [];
        
        for (let i = 0; i < level.foodCount; i++) {
            this.foods.push(this.createFood(i, level));
        }
    }

    createFood(index, level) {
        const spacing = this.canvas.width / (level.foodCount + 1);
        const startX = spacing * (index + 1);
        
        // 随机抛出位置：限制在玩家可到达范围内，避免太靠近边缘
        const safeMargin = this.player.width / 2 + 40;
        const minX = safeMargin;
        const maxX = this.canvas.width - safeMargin;
        const targetX = minX + Math.random() * (maxX - minX);
        
        return {
            x: startX,
            y: -50,
            vx: 0,
            vy: 0,
            gravity: 0.15 * level.speed,
            emoji: level.emoji,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.08 * level.speed,
            hand: index % 2,
            isThrown: false,
            isActive: false,
            spawnDelay: index * 1500,
            cycleCount: 0,
            maxHeight: -100,
            targetX: targetX
        };
    }

    update() {
        if (!this.isPlaying || this.isPaused) return;
        
        const level = LEVELS[this.currentLevel - 1];
        
        const now = Date.now();
        const elapsed = (now - this.startTime) / 1000;
        this.timeLeft = Math.max(0, level.timeLimit - elapsed);
        
        document.getElementById('timerText').textContent = `${Math.ceil(this.timeLeft)}s`;
        document.getElementById('countdownDisplay').textContent = `Time: ${Math.ceil(this.timeLeft)}s`;
        const timerPercent = (this.timeLeft / level.timeLimit) * 100;
        document.getElementById('timerFill').style.width = `${timerPercent}%`;
        
        if (Math.floor(this.timeLeft) !== Math.floor(this.timeLeft + 1/60) && this.timeLeft <= 5) {
            audioManager.playTick();
        }
        
        if (this.timeLeft <= 0) {
            this.gameOver(false);
            return;
        }
        
        // 玩家左右移动
        if (this.keys.ArrowLeft) {
            this.player.x = Math.max(0, this.player.x - this.player.moveSpeed);
        }
        if (this.keys.ArrowRight) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.moveSpeed);
        }
        // 更新玩家身体部位位置
        this.player.mouth.x = this.player.x + this.player.width / 2;
        
        // 检测是否有食物接近嘴巴，如果有则张嘴
        const hasFoodNearby = this.foods.some(food => {
            if (!food.isActive) return false;
            const dist = Math.sqrt(
                Math.pow(food.x - this.player.mouth.x, 2) +
                Math.pow(food.y - this.player.mouth.y, 2)
            );
            return dist < 80 && food.y > this.player.mouth.y - 50;
        });
        
        // 设置表情状态
        if (hasFoodNearby && this.player.emotion === 'normal') {
            this.player.emotion = 'open';
        } else if (!hasFoodNearby && this.player.emotion === 'open') {
            this.player.emotion = 'normal';
        }
        
        this.foods.forEach(food => {
            // 延迟激活食物
            if (!food.isActive) {
                food.spawnDelay -= 1000 / 60;
                if (food.spawnDelay <= 0) {
                    food.isActive = true;
                    food.isThrown = true;
                    // 初始向上抛出，力度很大
                    food.vy = -12 * level.speed;
                    food.x = food.targetX;
                    food.y = this.player.mouth.y;
                    audioManager.playThrow();
                }
                return;
            }
            
            food.vy += food.gravity;
            food.y += food.vy;
            food.x += food.vx;
            food.rotation += food.rotationSpeed;
            
            const handY = this.player.y + this.player.height - 20;
            
            // 到达手部位置，再次向上抛出（更高）
            if (food.y >= handY && food.vy > 0) {
                food.vy = -12 * level.speed;
                food.y = handY - 5;
                food.cycleCount++;
                audioManager.playThrow();
            }
            
            // 嘴部判定区（扩大范围）
            const distToMouth = Math.sqrt(
                Math.pow(food.x - this.player.mouth.x, 2) +
                Math.pow(food.y - this.player.mouth.y, 2)
            );
            
            food.inMouthZone = distToMouth < 50;
        });
        
        this.render();
    }

    tryEat() {
        const level = LEVELS[this.currentLevel - 1];
        const foodIndex = this.foods.findIndex(food => food.inMouthZone && food.isActive);
        
        if (foodIndex !== -1) {
            this.bites++;
            audioManager.playEat();
            this.player.emotion = 'happy';
            
            setTimeout(() => {
                this.player.emotion = 'normal';
            }, 300);
            
            // 移除被吃掉的食物
            this.foods.splice(foodIndex, 1);
            
            // 补充新食物（延迟生成）
            const newFood = this.createFood(this.foods.length, level);
            newFood.spawnDelay = 2000;
            this.foods.push(newFood);
            
            document.getElementById('progressText').textContent = `${this.bites}/${level.bites}`;
            this.updateProgress();
            
            if (this.bites >= level.bites) {
                this.gameOver(true);
            }
        }
    }

    updateProgress() {
        const level = LEVELS[this.currentLevel - 1];
        const percent = (this.bites / level.bites) * 100;
        document.getElementById('progressFill').style.width = `${percent}%`;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawPlayer();
        this.foods.forEach(food => this.drawFood(food));
    }

    drawPlayer() {
        const { x, y, width, height, emotion } = this.player;
        
        // 使用图片资源绘制人物
        if (this.playerSprites.idle && this.playerSprites.idle.complete) {
            let sprite = this.playerSprites.idle;
            
            if (emotion === 'happy' && this.playerSprites.happy && this.playerSprites.happy.complete) {
                sprite = this.playerSprites.happy;
            } else if (emotion === 'open' && this.playerSprites.open && this.playerSprites.open.complete) {
                sprite = this.playerSprites.open;
            }
            
            this.ctx.drawImage(sprite, x, y, width, height);
            return;
        }
        
        // 默认绘制（使用代码绘制）
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.roundRect(x + 15, y + 70, width - 30, height - 70, 10);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFE0BD';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + 45, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#333';
        if (emotion === 'happy') {
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2 - 15, y + 35, 6, 0, Math.PI);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2 + 15, y + 35, 6, 0, Math.PI);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2 - 15, y + 35, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2 + 15, y + 35, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#FF6B6B';
        if (emotion === 'happy') {
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + 60, 18, 0, Math.PI);
            this.ctx.fill();
        } else if (emotion === 'open') {
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + 60, 15, 0, Math.PI);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + 60, 8, 0, Math.PI);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + 25, 35, Math.PI, 0);
        this.ctx.fill();
    }

    drawFood(food) {
        this.ctx.save();
        this.ctx.translate(food.x, food.y);
        this.ctx.rotate(food.rotation);
        
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(food.emoji, 0, 0);
        
        if (food.inMouthZone) {
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 45, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pauseMenu').classList.remove('hidden');
        } else {
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }

    restartLevel() {
        document.getElementById('pauseMenu').classList.add('hidden');
        this.startLevel(this.currentLevel);
    }

    quitToMenu() {
        document.getElementById('pauseMenu').classList.add('hidden');
        this.isPlaying = false;
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.showMenu();
    }

    gameOver(success) {
        this.isPlaying = false;
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.hideAll();
        document.getElementById('levelResult').classList.remove('hidden');
        
        const level = LEVELS[this.currentLevel - 1];
        
        if (success) {
            document.getElementById('resultTitle').textContent = '🎉 通关成功!';
            audioManager.playSuccess();
            
            const timePercent = this.timeLeft / level.timeLimit;
            let stars = 1;
            if (timePercent > 0.5) stars = 3;
            else if (timePercent > 0.3) stars = 2;
            
            const earnedScore = level.bites * 10 + Math.floor(this.timeLeft * 2) + stars * 50;
            this.stats.totalScore += earnedScore;
            
            if (!this.stats.levelStars[this.currentLevel] || stars > this.stats.levelStars[this.currentLevel]) {
                this.stats.levelStars[this.currentLevel] = stars;
                this.stats.starCount += stars - (this.stats.levelStars[this.currentLevel] || 0);
            }
            
            if (this.currentLevel > this.stats.completedLevels) {
                this.stats.completedLevels = this.currentLevel;
            }
            
            if (this.timeLeft < this.stats.fastestTime) {
                this.stats.fastestTime = this.timeLeft;
            }
            
            if (this.bites === level.bites && this.timeLeft > 0) {
                this.stats.perfectRuns++;
            }
            
            if (this.currentLevel > this.stats.unlockedFoods) {
                this.stats.unlockedFoods = this.currentLevel;
            }
            
            if (this.currentLevel === this.stats.unlockedLevels && this.currentLevel < 10) {
                this.stats.unlockedLevels++;
                audioManager.playLevelUp();
            }
            
            this.checkAchievements();
            saveStats(this.stats);
            
            this.renderStars(stars);
            document.getElementById('remainingTime').textContent = Math.ceil(this.timeLeft);
            document.getElementById('earnedScore').textContent = earnedScore;
            document.getElementById('newTotalScore').textContent = this.stats.totalScore;
            
            document.getElementById('nextLevelBtn').style.display = this.currentLevel >= 10 ? 'none' : 'inline-block';
            
        } else {
            document.getElementById('resultTitle').textContent = '😢 时间到!';
            audioManager.playFail();
            this.renderStars(0);
            document.getElementById('remainingTime').textContent = 0;
            document.getElementById('earnedScore').textContent = 0;
            document.getElementById('newTotalScore').textContent = this.stats.totalScore;
            document.getElementById('nextLevelBtn').style.display = 'none';
        }
    }

    renderStars(stars) {
        const starsDiv = document.getElementById('stars');
        starsDiv.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.textContent = i < stars ? '⭐' : '☆';
            star.style.fontSize = '2.5rem';
            star.style.opacity = i < stars ? 1 : 0.3;
            starsDiv.appendChild(star);
            
            if (i < stars) {
                setTimeout(() => {
                    audioManager.playStar();
                    star.style.transform = 'scale(1.5)';
                    setTimeout(() => {
                        star.style.transform = 'scale(1)';
                    }, 200);
                }, i * 300);
            }
        }
    }

    checkAchievements() {
        ACHIEVEMENTS.forEach(achievement => {
            if (!this.stats.unlockedAchievements.includes(achievement.id)) {
                if (achievement.condition(this.stats)) {
                    this.stats.unlockedAchievements.push(achievement.id);
                }
            }
        });
    }

    nextLevel() {
        if (this.currentLevel < 10) {
            this.startLevel(this.currentLevel + 1);
        }
    }
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

const game = new Game();
game.showMenu();