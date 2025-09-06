class DDRGame {
    constructor() {
        this.audio = document.getElementById('game-audio');
        this.gameArea = document.getElementById('game-area');
        this.topScreen = document.getElementById('top-screen');
        this.levelSelectScreen = document.getElementById('level-select-screen');
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.missHits = 0;
        
        this.isPlaying = false;
        this.startTime = 0;
        this.notes = [];
        this.activeNotes = [];
        
        this.lanes = ['left', 'down', 'up', 'right'];
        this.keyMap = {
            'ArrowLeft': 'left',
            'ArrowDown': 'down',
            'ArrowUp': 'up',
            'ArrowRight': 'right'
        };
        
        this.difficultySettings = {
            easy: { 
                speed: 2.5, 
                noteFrequency: 0.25, 
                complexity: 0.8,
                level: 1,
                name: 'Easy',
                color: '#4CAF50'
            },
            normal: { 
                speed: 3.5, 
                noteFrequency: 0.4, 
                complexity: 1.3,
                level: 2,
                name: 'Normal',
                color: '#FF9800'
            },
            hard: { 
                speed: 5, 
                noteFrequency: 0.6, 
                complexity: 2.2,
                level: 3,
                name: 'Hard',
                color: '#F44336'
            }
        };
        
        this.selectedSong = {
            filename: 'hentaisong.mp3',
            title: 'hentaisong',
            path: 'assets/audio/hentaisong.mp3'
        };
        this.selectedDifficulty = null;
        
        this.setupEventListeners();
        this.generateBeatmap();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));
        
        this.audio.addEventListener('ended', () => this.endGame());
        this.audio.addEventListener('timeupdate', () => this.updateGame());
    }
    
    generateBeatmap() {
        const duration = 180; // 3分間のデフォルト時間
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        const bpm = 140; // 仮のBPM
        const beatInterval = 60 / bpm;
        
        this.notes = [];
        
        for (let time = 2; time < duration; time += beatInterval / difficulty.complexity) {
            if (Math.random() < difficulty.noteFrequency) {
                // 単体ノーツ
                const lane = Math.floor(Math.random() * 4);
                this.notes.push({
                    time: time,
                    lane: lane,
                    type: 'single'
                });
            }
            
            // より高い難易度では同時押しを追加
            if (difficulty.complexity > 1.5 && Math.random() < 0.2) {
                const lanes = [];
                const numSimultaneous = Math.floor(Math.random() * 2) + 2; // 2-3同時
                
                while (lanes.length < numSimultaneous) {
                    const lane = Math.floor(Math.random() * 4);
                    if (!lanes.includes(lane)) {
                        lanes.push(lane);
                    }
                }
                
                lanes.forEach(lane => {
                    this.notes.push({
                        time: time,
                        lane: lane,
                        type: 'simultaneous'
                    });
                });
            }
        }
        
        this.notes.sort((a, b) => a.time - b.time);
        this.totalNotes = this.notes.length;
    }
    
    showLevelSelect() {
        console.log('DDRGame.showLevelSelect() called');
        console.log('topScreen:', this.topScreen);
        console.log('levelSelectScreen:', this.levelSelectScreen);
        
        if (!this.topScreen || !this.levelSelectScreen) {
            console.error('Screen elements not found!');
            return;
        }
        
        console.log('Hiding top screen');
        this.topScreen.classList.add('hidden');
        console.log('Showing level select screen');
        this.levelSelectScreen.classList.remove('hidden');
        
        console.log('Top screen classes:', this.topScreen.className);
        console.log('Level select classes:', this.levelSelectScreen.className);
    }
    
    showTopScreen() {
        this.topScreen.classList.remove('hidden');
        this.levelSelectScreen.classList.add('hidden');
        this.gameArea.classList.add('hidden');
    }
    
    selectLevelAndStart(difficulty) {
        this.selectedDifficulty = difficulty;
        this.startGame();
    }
    
    startGame() {
        if (!this.selectedSong || !this.selectedDifficulty) {
            alert('楽曲と難易度を選択してください');
            return;
        }
        this.audio.src = this.selectedSong.path;
        
        // 音楽の長さを取得してビートマップを再生成
        this.audio.addEventListener('loadedmetadata', () => {
            this.generateBeatmapFromAudio();
        }, { once: true });
        
        this.resetGame();
        this.topScreen.classList.add('hidden');
        this.levelSelectScreen.classList.add('hidden');
        this.gameArea.classList.remove('hidden');
        
        this.audio.play();
        this.isPlaying = true;
        this.startTime = performance.now();
        
        this.gameLoop();
    }
    
    generateBeatmapFromAudio() {
        const duration = this.audio.duration;
        
        // ランダムビートマップ生成
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        this.notes = [];
        
        for (let time = 2; time < duration - 2; time += 0.3 / difficulty.complexity) {
            if (Math.random() < difficulty.noteFrequency) {
                const patterns = this.getPatterns(difficulty.complexity, time);
                patterns.forEach(note => this.notes.push(note));
            }
        }
        
        this.notes.sort((a, b) => a.time - b.time);
        this.totalNotes = this.notes.length;
    }
    
    generateBeatmapForDifficulty(difficultyName) {
        const difficulty = this.difficultySettings[difficultyName];
        const duration = 180; // 3分のデフォルト時間
        const notes = [];
        
        for (let time = 2; time < duration - 2; time += 0.4 / difficulty.complexity) {
            if (Math.random() < difficulty.noteFrequency) {
                const patterns = this.getPatterns(difficulty.complexity, time);
                patterns.forEach(note => notes.push(note));
            }
        }
        
        return notes.sort((a, b) => a.time - b.time);
    }
    
    getPatterns(complexity, time) {
        const patterns = [];
        
        if (complexity >= 2.5) {
            // Master: 複雑なパターン
            if (Math.random() < 0.3) {
                // ストリーム（連続ノーツ）
                const startLane = Math.floor(Math.random() * 4);
                for (let i = 0; i < 4; i++) {
                    patterns.push({
                        time: time + i * 0.1,
                        lane: (startLane + i) % 4,
                        type: 'stream'
                    });
                }
            } else if (Math.random() < 0.4) {
                // トリプル
                const lanes = this.getRandomLanes(3);
                lanes.forEach(lane => {
                    patterns.push({ time, lane, type: 'triple' });
                });
            }
        } else if (complexity >= 2) {
            // Expert: 同時押し多め
            if (Math.random() < 0.25) {
                const lanes = this.getRandomLanes(2);
                lanes.forEach(lane => {
                    patterns.push({ time, lane, type: 'double' });
                });
            }
        }
        
        // 基本の単体ノーツ
        if (patterns.length === 0) {
            patterns.push({
                time,
                lane: Math.floor(Math.random() * 4),
                type: 'single'
            });
        }
        
        return patterns;
    }
    
    getRandomLanes(count) {
        const lanes = [];
        while (lanes.length < count) {
            const lane = Math.floor(Math.random() * 4);
            if (!lanes.includes(lane)) {
                lanes.push(lane);
            }
        }
        return lanes;
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        this.spawnNotes();
        this.updateNotes();
        this.cleanupNotes();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    spawnNotes() {
        const currentTime = this.audio.currentTime;
        const spawnTime = 3; // 3秒前にスポーン
        
        this.notes.forEach((note, index) => {
            if (!note.spawned && note.time - currentTime <= spawnTime) {
                this.createNoteElement(note);
                note.spawned = true;
            }
        });
    }
    
    createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = `note ${this.lanes[note.lane]}`;
        
        const arrows = ['←', '↓', '↑', '→'];
        noteElement.textContent = arrows[note.lane];
        noteElement.style.color = 'white';
        noteElement.style.textShadow = '0 0 10px white';
        
        const lane = document.querySelectorAll('.lane')[note.lane];
        lane.appendChild(noteElement);
        
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        const fallDuration = 3000 / difficulty.speed;
        
        noteElement.style.animationDuration = `${fallDuration}ms`;
        
        note.element = noteElement;
        note.spawnTime = performance.now();
        this.activeNotes.push(note);
    }
    
    updateNotes() {
        // ノーツの更新処理（必要に応じて）
    }
    
    cleanupNotes() {
        this.activeNotes = this.activeNotes.filter(note => {
            if (note.element && note.element.offsetTop > window.innerHeight) {
                if (!note.hit) {
                    this.processMiss();
                }
                note.element.remove();
                return false;
            }
            return true;
        });
    }
    
    handleKeyPress(e) {
        if (e.key === 'Escape') {
            this.returnToMenu();
            return;
        }
        
        if (!this.isPlaying || !this.keyMap[e.key]) return;
        
        const direction = this.keyMap[e.key];
        const laneIndex = this.lanes.indexOf(direction);
        
        this.processHit(laneIndex);
        this.addVisualFeedback(laneIndex);
    }
    
    handleKeyRelease(e) {
        // キー離し時の処理
    }
    
    processHit(laneIndex) {
        const currentTime = this.audio.currentTime;
        const targetNotes = this.activeNotes.filter(note => 
            note.lane === laneIndex && !note.hit
        );
        
        if (targetNotes.length === 0) return;
        
        // 最も近いノーツを見つける
        let closestNote = null;
        let minTimeDiff = Infinity;
        
        targetNotes.forEach(note => {
            const timeDiff = Math.abs(note.time - currentTime);
            if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestNote = note;
            }
        });
        
        if (!closestNote) return;
        
        const timingWindow = this.getTimingWindow(minTimeDiff);
        if (timingWindow) {
            closestNote.hit = true;
            closestNote.element.remove();
            this.processTimingHit(timingWindow);
        }
    }
    
    getTimingWindow(timeDiff) {
        if (timeDiff <= 0.05) return 'perfect';
        if (timeDiff <= 0.1) return 'great';
        if (timeDiff <= 0.15) return 'good';
        return null;
    }
    
    processTimingHit(timing) {
        this.hitNotes++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        let points = 0;
        let color = '';
        
        switch (timing) {
            case 'perfect':
                this.perfectHits++;
                points = 1000;
                color = 'perfect';
                break;
            case 'great':
                this.greatHits++;
                points = 500;
                color = 'great';
                break;
            case 'good':
                this.goodHits++;
                points = 200;
                color = 'good';
                break;
        }
        
        this.score += points * (1 + this.combo * 0.01);
        this.showJudgment(timing.toUpperCase(), color);
        this.updateUI();
    }
    
    processMiss() {
        this.missHits++;
        this.combo = 0;
        this.showJudgment('MISS', 'miss');
        this.updateUI();
    }
    
    showJudgment(text, className) {
        const judgment = document.createElement('div');
        judgment.className = `judgment ${className}`;
        judgment.textContent = text;
        
        document.body.appendChild(judgment);
        
        setTimeout(() => {
            judgment.remove();
        }, 1000);
    }
    
    addVisualFeedback(laneIndex) {
        const lane = document.querySelectorAll('.lane')[laneIndex];
        lane.style.background = 'rgba(255, 255, 255, 0.3)';
        
        setTimeout(() => {
            lane.style.background = 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%)';
        }, 100);
    }
    
    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('combo').textContent = this.combo;
        
        const accuracy = this.totalNotes > 0 ? 
            ((this.perfectHits + this.greatHits * 0.8 + this.goodHits * 0.5) / this.hitNotes) * 100 : 100;
        document.getElementById('accuracy').textContent = accuracy.toFixed(1) + '%';
    }
    
    updateGame() {
        if (!this.isPlaying) return;
        // ゲーム状態の更新
    }
    
    endGame() {
        this.isPlaying = false;
        
        setTimeout(() => {
            this.showResults();
        }, 2000);
    }
    
    showResults() {
        const accuracy = this.totalNotes > 0 ? 
            ((this.perfectHits + this.greatHits * 0.8 + this.goodHits * 0.5) / this.totalNotes) * 100 : 0;
        
        let rank = 'F';
        if (accuracy >= 95) rank = 'SSS';
        else if (accuracy >= 90) rank = 'SS';
        else if (accuracy >= 85) rank = 'S';
        else if (accuracy >= 80) rank = 'A';
        else if (accuracy >= 70) rank = 'B';
        else if (accuracy >= 60) rank = 'C';
        else if (accuracy >= 50) rank = 'D';
        
        alert(`ゲーム終了！\n\nスコア: ${Math.floor(this.score)}\n最大コンボ: ${this.maxCombo}\n正確度: ${accuracy.toFixed(1)}%\nランク: ${rank}\n\nPerfect: ${this.perfectHits}\nGreat: ${this.greatHits}\nGood: ${this.goodHits}\nMiss: ${this.missHits}`);
        
        this.returnToMenu();
    }
    
    returnToMenu() {
        this.isPlaying = false;
        this.audio.pause();
        this.audio.currentTime = 0;
        
        this.gameArea.classList.add('hidden');
        this.showTopScreen();
        
        // ノーツをクリア
        this.activeNotes.forEach(note => {
            if (note.element) {
                note.element.remove();
            }
        });
        
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.missHits = 0;
        this.notes = [];
        this.activeNotes = [];
        
        this.updateUI();
    }
}

// ゲーム初期化
let game;

// ページ読み込み時にゲームインスタンスを作成
document.addEventListener('DOMContentLoaded', () => {
    game = new DDRGame();
    console.log('Game initialized:', game);
    console.log('Top screen element:', game.topScreen);
    console.log('Level select element:', game.levelSelectScreen);
});

// グローバル関数 - 確実にゲームが初期化されているかチェック
function showLevelSelect() {
    console.log('showLevelSelect called, game:', game);
    if (!game) {
        console.log('Game not initialized, creating new instance');
        game = new DDRGame();
    }
    
    if (game && game.topScreen && game.levelSelectScreen) {
        console.log('Executing screen transition');
        game.showLevelSelect();
    } else {
        console.error('Required elements not found:', {
            game: !!game,
            topScreen: !!game?.topScreen,
            levelSelectScreen: !!game?.levelSelectScreen
        });
    }
}

function selectLevelAndStart(difficulty) {
    console.log('selectLevelAndStart called with difficulty:', difficulty);
    if (!game) {
        game = new DDRGame();
    }
    if (game) {
        game.selectLevelAndStart(difficulty);
    }
}

// ゲーム開始用のグローバル関数
function startGame() {
    console.log('startGame called, game:', game);
    if (!game) {
        game = new DDRGame();
    }
    game.startGame();
}

// デバッグ情報
console.log('DDR Rhythm Game が読み込まれました！');

// デバッグ用関数
function debugScreens() {
    const topScreen = document.getElementById('top-screen');
    const levelScreen = document.getElementById('level-select-screen');
    
    console.log('=== Screen Debug Info ===');
    console.log('Top screen element:', topScreen);
    console.log('Top screen classes:', topScreen?.className);
    console.log('Level screen element:', levelScreen);
    console.log('Level screen classes:', levelScreen?.className);
    console.log('Game object:', game);
    
    if (topScreen && levelScreen) {
        console.log('Elements found! Testing manual transition...');
        topScreen.classList.add('hidden');
        levelScreen.classList.remove('hidden');
        console.log('After transition:');
        console.log('Top screen classes:', topScreen.className);
        console.log('Level screen classes:', levelScreen.className);
    }
}

// ページ読み込み後にデバッグ情報を出力
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('=== Page Load Complete ===');
        debugScreens();
    }, 1000);
});