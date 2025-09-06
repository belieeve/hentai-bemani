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
            path: './assets/audio/hentaisong.mp3'
        };
        this.selectedDifficulty = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));
        
        this.audio.addEventListener('ended', () => this.endGame());
        this.audio.addEventListener('timeupdate', () => this.updateGame());
    }
    
    generateBeatmap() {
        if (!this.selectedDifficulty) {
            console.log('No difficulty selected, skipping beatmap generation');
            return;
        }
        
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
                    type: 'single',
                    spawned: false,
                    hit: false
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
                        type: 'simultaneous',
                        spawned: false,
                        hit: false
                    });
                });
            }
        }
        
        this.notes.sort((a, b) => a.time - b.time);
        this.totalNotes = this.notes.length;
        console.log('Generated beatmap with', this.notes.length, 'notes for difficulty:', this.selectedDifficulty);
    }
    
    showLevelSelect() {
        this.topScreen.classList.add('hidden');
        this.levelSelectScreen.classList.remove('hidden');
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
        
        // スコアのみリセット（notesはリセットしない）
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.niceHits = 0;
        this.badHits = 0;
        this.missHits = 0;
        this.activeNotes = [];
        
        // まず固定時間でビートマップを生成
        this.generateBeatmap();
        console.log('Initial beatmap generated with', this.notes.length, 'notes');
        
        // 画面遷移
        this.topScreen.classList.add('hidden');
        this.levelSelectScreen.classList.add('hidden');
        this.gameArea.classList.remove('hidden');
        
        // 音楽の設定とロード
        this.audio.src = this.selectedSong.path;
        
        // 音楽ロードのタイムアウト設定
        let audioLoaded = false;
        
        // エラーハンドリングを追加
        this.audio.addEventListener('error', (e) => {
            console.warn('Audio loading failed, starting game without music');
            if (!audioLoaded) {
                audioLoaded = true;
                this.startGameWithoutAudio();
            }
        }, { once: true });
        
        // 音楽の長さを取得してビートマップを再生成
        this.audio.addEventListener('loadedmetadata', () => {
            console.log('Audio loaded successfully, duration:', this.audio.duration);
            this.generateBeatmapFromAudio();
            console.log('Audio beatmap generated with', this.notes.length, 'notes for', this.selectedDifficulty, 'difficulty');
            if (!audioLoaded) {
                audioLoaded = true;
                this.startGameplay();
            }
        }, { once: true });
        
        // 2秒後にタイムアウトして音楽なしで開始
        setTimeout(() => {
            if (!audioLoaded) {
                console.warn('Audio loading timeout, starting without music');
                audioLoaded = true;
                this.startGameWithoutAudio();
            }
        }, 2000);
        
        // 音楽ロード開始
        try {
            this.audio.load();
        } catch (e) {
            console.warn('Audio load() failed:', e);
            if (!audioLoaded) {
                audioLoaded = true;
                this.startGameWithoutAudio();
            }
        }
    }
    
    startGameWithoutAudio() {
        console.log('Starting game without audio');
        this.startGameplay();
    }
    
    startGameplay() {
        this.isPlaying = true;
        this.startTime = performance.now();
        this.updateUI();
        
        // 音楽を再生（可能な場合）
        if (this.audio.src && !this.audio.error) {
            this.audio.play().catch(e => {
                console.warn('Audio play failed:', e);
            });
        }
        
        this.gameLoop();
    }
    
    generateBeatmapFromAudio() {
        const duration = this.audio.duration || 180;
        
        // ランダムビートマップ生成
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        this.notes = [];
        
        for (let time = 2; time < duration - 2; time += 0.3 / difficulty.complexity) {
            if (Math.random() < difficulty.noteFrequency) {
                const patterns = this.getPatterns(difficulty.complexity, time);
                patterns.forEach(note => {
                    note.spawned = false;
                    note.hit = false;
                    this.notes.push(note);
                });
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
        // 音楽がない場合は経過時間を使用
        const currentTime = this.audio.currentTime || (performance.now() - this.startTime) / 1000;
        const spawnTime = 3; // 3秒前にスポーン
        
        if (this.notes.length === 0) {
            console.log('No notes available to spawn!');
            return;
        }
        
        let spawnedCount = 0;
        this.notes.forEach((note, index) => {
            if (!note.spawned && note.time - currentTime <= spawnTime) {
                this.createNoteElement(note);
                note.spawned = true;
                spawnedCount++;
            }
        });
        
        if (spawnedCount > 0) {
            console.log('Spawned', spawnedCount, 'notes at time', currentTime.toFixed(2));
        }
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
            if (note.element && note.element.getBoundingClientRect().top > window.innerHeight) {
                if (!note.hit) {
                    this.processMiss();
                    console.log('Missed note at lane', note.lane);
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
        const currentTime = this.audio.currentTime || (performance.now() - this.startTime) / 1000;
        const targetNotes = this.activeNotes.filter(note => 
            note.lane === laneIndex && !note.hit
        );
        
        if (targetNotes.length === 0) {
            // タイミング外のキー入力でもBadを表示
            this.showJudgment('BAD', 'bad');
            return;
        }
        
        // ターゲットエリアに最も近いノーツを見つける
        let closestNote = null;
        let minPositionDiff = Infinity;
        
        targetNotes.forEach(note => {
            if (note.element) {
                const noteRect = note.element.getBoundingClientRect();
                const targetRect = document.querySelectorAll('.target-area')[laneIndex].getBoundingClientRect();
                const positionDiff = Math.abs(noteRect.bottom - targetRect.bottom);
                
                if (positionDiff < minPositionDiff) {
                    minPositionDiff = positionDiff;
                    closestNote = note;
                }
            }
        });
        
        if (!closestNote) return;
        
        const timingWindow = this.getPositionTimingWindow(minPositionDiff);
        if (timingWindow) {
            closestNote.hit = true;
            closestNote.element.remove();
            this.processTimingHit(timingWindow);
            console.log('Hit:', timingWindow, 'at position diff:', minPositionDiff);
        } else {
            this.showJudgment('BAD', 'bad');
        }
    }
    
    getTimingWindow(timeDiff) {
        if (timeDiff <= 0.03) return 'perfect';
        if (timeDiff <= 0.06) return 'great';
        if (timeDiff <= 0.09) return 'good';
        if (timeDiff <= 0.12) return 'nice';
        if (timeDiff <= 0.18) return 'bad';
        return null;
    }
    
    getPositionTimingWindow(positionDiff) {
        // ピクセル単位での判定（ターゲットエリアからの距離）
        if (positionDiff <= 15) return 'perfect';
        if (positionDiff <= 30) return 'great';
        if (positionDiff <= 45) return 'good';
        if (positionDiff <= 60) return 'nice';
        if (positionDiff <= 80) return 'bad';
        return null;
    }
    
    processTimingHit(timing) {
        this.hitNotes++;
        
        let points = 0;
        let color = '';
        let breakCombo = false;
        
        switch (timing) {
            case 'perfect':
                this.perfectHits++;
                points = 1000;
                color = 'perfect';
                this.combo++;
                break;
            case 'great':
                this.greatHits++;
                points = 800;
                color = 'great';
                this.combo++;
                break;
            case 'good':
                this.goodHits++;
                points = 500;
                color = 'good';
                this.combo++;
                break;
            case 'nice':
                this.niceHits = (this.niceHits || 0) + 1;
                points = 200;
                color = 'nice';
                this.combo++;
                break;
            case 'bad':
                this.badHits = (this.badHits || 0) + 1;
                points = 50;
                color = 'bad';
                this.combo = 0;
                breakCombo = true;
                break;
        }
        
        if (!breakCombo) {
            this.maxCombo = Math.max(this.maxCombo, this.combo);
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
        
        const accuracy = this.hitNotes > 0 ? 
            ((this.perfectHits + this.greatHits * 0.9 + this.goodHits * 0.7 + (this.niceHits || 0) * 0.4 + (this.badHits || 0) * 0.1) / this.hitNotes) * 100 : 100;
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
            ((this.perfectHits + this.greatHits * 0.9 + this.goodHits * 0.7 + (this.niceHits || 0) * 0.4 + (this.badHits || 0) * 0.1) / this.totalNotes) * 100 : 0;
        
        let rank = 'F';
        if (accuracy >= 95) rank = 'SSS';
        else if (accuracy >= 90) rank = 'SS';
        else if (accuracy >= 85) rank = 'S';
        else if (accuracy >= 80) rank = 'A';
        else if (accuracy >= 70) rank = 'B';
        else if (accuracy >= 60) rank = 'C';
        else if (accuracy >= 50) rank = 'D';
        
        alert(`ゲーム終了！\n\nスコア: ${Math.floor(this.score)}\n最大コンボ: ${this.maxCombo}\n正確度: ${accuracy.toFixed(1)}%\nランク: ${rank}\n\nPerfect: ${this.perfectHits}\nGreat: ${this.greatHits}\nGood: ${this.goodHits}\nNice: ${this.niceHits || 0}\nBad: ${this.badHits || 0}\nMiss: ${this.missHits}`);
        
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
        this.niceHits = 0;
        this.badHits = 0;
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
});

// グローバル関数
function showLevelSelect() {
    console.log('showLevelSelect called, game:', game);
    if (game) {
        game.showLevelSelect();
    }
}

function selectLevelAndStart(difficulty) {
    console.log('selectLevelAndStart called with difficulty:', difficulty);
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