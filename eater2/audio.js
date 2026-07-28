class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.bgmPlaying = false;
        this.bgmSource = null;
        this.bgmGain = null;
        
        // 音效文件缓存
        this.sounds = {};
        
        // 音效文件路径配置
        this.soundPaths = {
            bgm: 'assets/audio/bgm.mp3',
            throw: 'assets/audio/throw.mp3',
            catch: 'assets/audio/catch.mp3',
            eat: 'assets/audio/eat.mp3',
            success: 'assets/audio/success.mp3',
            fail: 'assets/audio/fail.mp3',
            star: 'assets/audio/star.mp3',
            tick: 'assets/audio/tick.mp3',
            level_up: 'assets/audio/level_up.mp3',
            click: 'assets/audio/click.mp3'
        };
        
        // 是否使用外部文件（默认使用合成音效）
        this.useExternalFiles = false;
        
        // 音量设置
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.5;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // 尝试加载外部音效文件
    async loadExternalSounds() {
        if (!this.audioContext) this.init();
        
        console.log('开始加载外部音效文件...');
        
        const loadPromises = [];
        
        for (const [name, path] of Object.entries(this.soundPaths)) {
            const loadPromise = new Promise((resolve) => {
                try {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    
                    // 设置默认音量
                    if (name === 'bgm') {
                        audio.volume = this.bgmVolume;
                        audio.loop = true;
                    } else {
                        audio.volume = this.sfxVolume;
                    }
                    
                    // 尝试加载
                    audio.addEventListener('canplaythrough', () => {
                        this.sounds[name] = audio;
                        console.log(`音效加载成功: ${name}`);
                        resolve(true);
                    });
                    
                    audio.addEventListener('error', () => {
                        console.log(`音效加载失败: ${name} (${path})`);
                        resolve(false);
                    });
                    
                    // 设置src触发加载
                    audio.src = path;
                    
                } catch (e) {
                    console.warn(`无法加载音效: ${path}`, e);
                    resolve(false);
                }
            });
            
            loadPromises.push(loadPromise);
        }
        
        // 等待所有音效加载完成
        await Promise.all(loadPromises);
        
        // 至少有一个音效加载成功就标记为使用外部文件
        this.useExternalFiles = Object.keys(this.sounds).length > 0;
        console.log(`音效加载完成，成功加载 ${Object.keys(this.sounds).length} 个音效`);
    }

    async checkFileExists(url) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, true);
            xhr.onload = () => {
                resolve(xhr.status >= 200 && xhr.status < 300);
            };
            xhr.onerror = () => {
                resolve(false);
            };
            xhr.send();
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.bgmPlaying) {
            this.stopBGM();
        } else if (enabled && !this.bgmPlaying) {
            this.playBGM();
        }
    }

    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmSource) {
            this.bgmSource.volume = this.bgmVolume;
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        for (const [name, sound] of Object.entries(this.sounds)) {
            if (name !== 'bgm') {
                sound.volume = this.sfxVolume;
            }
        }
    }

    playBGM() {
        if (!this.enabled || !this.audioContext) return;
        if (this.bgmPlaying) return;
        
        // 如果BGM已经加载好了，直接播放
        if (this.sounds.bgm) {
            this.bgmSource = this.sounds.bgm;
            this.bgmSource.loop = true;
            this.bgmSource.volume = this.bgmVolume;
            this.bgmSource.play().catch((e) => {
                console.log('BGM播放失败，可能需要用户交互:', e);
            });
            this.bgmPlaying = true;
            console.log('外部BGM已播放（预加载）');
            return;
        }
        
        // 如果还没加载好，直接创建并播放
        // 不等待预加载完成，确保能及时播放
        console.log('BGM未预加载，直接创建播放...');
        const bgm = new Audio(this.soundPaths.bgm);
        bgm.loop = true;
        bgm.volume = this.bgmVolume;
        
        bgm.addEventListener('canplay', () => {
            this.sounds.bgm = bgm;
            bgm.play().catch((e) => {
                console.log('BGM播放失败:', e);
            });
            this.bgmPlaying = true;
            console.log('外部BGM已播放（直接加载）');
        });
        
        bgm.addEventListener('error', () => {
            console.log('BGM加载失败:', this.soundPaths.bgm);
            // 标记为已播放（空播放），避免重复尝试
            this.bgmPlaying = true;
        });
        
        bgm.src = this.soundPaths.bgm;
    }

    playBGM_Synth() {
        // 默认不播放合成BGM，等待用户添加外部bgm文件
        // 只在有外部文件时才播放音乐
        // 如果没有外部文件，保持安静，避免干扰游戏体验
        console.log('合成BGM已禁用，请添加外部bgm.mp3文件');
        this.bgmPlaying = true;
    }

    stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.pause();
            this.bgmSource.currentTime = 0;
            this.bgmSource = null;
        }
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
        if (this.bgmGain) {
            this.bgmGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
            setTimeout(() => {
                if (this.bgmGain) {
                    this.bgmGain.disconnect();
                    this.bgmGain = null;
                }
            }, 500);
        }
        this.bgmPlaying = false;
    }

    playThrow() {
        if (this.useExternalFiles && this.sounds.throw) {
            this.playExternalSound('throw');
            return;
        }
        this.playThrow_Synth();
    }

    playThrow_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playCatch() {
        if (this.useExternalFiles && this.sounds.catch) {
            this.playExternalSound('catch');
            return;
        }
        this.playCatch_Synth();
    }

    playCatch_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.08);
    }

    playEat() {
        if (this.useExternalFiles && this.sounds.eat) {
            this.playExternalSound('eat');
            return;
        }
        this.playEat_Synth();
    }

    playEat_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    playSuccess() {
        if (this.useExternalFiles && this.sounds.success) {
            this.playExternalSound('success');
            return;
        }
        this.playSuccess_Synth();
    }

    playSuccess_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.3);
            }, i * 100);
        });
    }

    playFail() {
        if (this.useExternalFiles && this.sounds.fail) {
            this.playExternalSound('fail');
            return;
        }
        this.playFail_Synth();
    }

    playFail_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const notes = [400, 300, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.2);
            }, i * 100);
        });
    }

    playStar() {
        if (this.useExternalFiles && this.sounds.star) {
            this.playExternalSound('star');
            return;
        }
        this.playStar_Synth();
    }

    playStar_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    playTick() {
        if (this.useExternalFiles && this.sounds.tick) {
            this.playExternalSound('tick');
            return;
        }
        this.playTick_Synth();
    }

    playTick_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }

    playLevelUp() {
        if (this.useExternalFiles && this.sounds.level_up) {
            this.playExternalSound('level_up');
            return;
        }
        this.playLevelUp_Synth();
    }

    playLevelUp_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.2);
            }, i * 80);
        });
    }

    playClick() {
        if (this.useExternalFiles && this.sounds.click) {
            this.playExternalSound('click');
            return;
        }
        this.playClick_Synth();
    }

    playClick_Synth() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.02);
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }

    playExternalSound(name) {
        if (!this.enabled || !this.sounds[name]) return;
        
        const sound = this.sounds[name];
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

const audioManager = new AudioManager();
