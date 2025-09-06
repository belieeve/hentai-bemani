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
            title: '3:05の変態たち feat. 眠気',
            path: 'assets/audio/hentaisong.mp3'
        };
        this.selectedDifficulty = null;
        
        this.setupEventListeners();
        this.setupMobileControls();
        // generateBeatmap() is called when difficulty is selected
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));
        
        this.audio.addEventListener('ended', () => this.endGame());
        this.audio.addEventListener('timeupdate', () => this.updateGame());
    }
    
    setupMobileControls() {
        // より確実なモバイル検出
        const isMobile = this.detectMobile();
        const mobileControls = document.getElementById('mobile-controls');
        
        if (mobileControls) {
            this.mobileControls = mobileControls;
            
            if (isMobile) {
                console.log('Mobile device detected, touch controls will be available');
            }
        }
        
        // タッチイベントリスナーを設定
        this.setupTouchEvents();
    }
    
    detectMobile() {
        // 複数の条件でモバイルデバイスを検出
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallScreen = window.innerWidth <= 768;
        
        return mobileRegex.test(userAgent) || hasTouch || smallScreen;
    }
    
    setupTouchEvents() {
        document.querySelectorAll('.mobile-control-btn').forEach(btn => {
            // タッチスタート
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const key = btn.getAttribute('data-key');
                this.handleKeyPress({ key: key });
                this.addMobileButtonFeedback(btn, true);
            }, { passive: false });
            
            // タッチエンド
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addMobileButtonFeedback(btn, false);
            }, { passive: false });
            
            // タッチキャンセル
            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.addMobileButtonFeedback(btn, false);
            }, { passive: false });
            
            // マウスクリック（タブレット・デスクトップフォールバック）
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const key = btn.getAttribute('data-key');
                this.handleKeyPress({ key: key });
                this.addMobileButtonFeedback(btn, true);
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.addMobileButtonFeedback(btn, false);
            });
            
            btn.addEventListener('mouseleave', (e) => {
                this.addMobileButtonFeedback(btn, false);
            });
        });
    }
    
    addMobileButtonFeedback(btn, isActive) {
        const key = btn.getAttribute('data-key');
        
        if (isActive) {
            btn.classList.add('active');
            // 振動フィードバック（サポートされている場合）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            btn.classList.remove('active');
        }
    }
    
    generateBeatmap() {
        // selectedDifficultyがnullの場合はスキップ
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
        console.log('selectLevelAndStart called with difficulty:', difficulty);
        this.selectedDifficulty = difficulty;
        console.log('Selected difficulty set to:', this.selectedDifficulty);
        
        // 難易度が選択されたのでビートマップを生成
        this.generateBeatmap();
        
        this.startGame();
    }
    
    startGame() {
        if (!this.selectedSong || !this.selectedDifficulty) {
            alert('楽曲と難易度を選択してください');
            return;
        }
        // 音楽ファイルの読み込み
        this.loadAudioFile();
        
        this.gameLoop();
    }
    
    loadAudioFile() {
        console.log('Loading audio file:', this.selectedSong.path);
        
        // 音楽ファイルの設定
        this.audio.src = this.selectedSong.path;
        this.audio.crossOrigin = 'anonymous'; // CORS対応
        this.audio.preload = 'auto';
        
        // 音楽読み込み完了時の処理
        const onLoadedMetadata = () => {
            console.log('Audio metadata loaded, duration:', this.audio.duration);
            this.generateBeatmapFromAudio();
            this.startGameplay();
        };
        
        // 音楽読み込みエラー時の処理
        const onError = (error) => {
            console.error('Audio loading error:', error);
            alert('音楽ファイルの読み込みに失敗しました。しばらく待ってからもう一度お試しください。');
            this.returnToMenu();
        };
        
        // イベントリスナーを設定
        this.audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        this.audio.addEventListener('error', onError, { once: true });
        
        // 音楽ファイルの読み込みを開始
        this.audio.load();
    }
    
    startGameplay() {
        console.log('Starting gameplay');
        
        this.resetGame();
        
        // 画面切り替え
        this.topScreen.classList.add('hidden');
        this.levelSelectScreen.classList.add('hidden');
        this.gameArea.classList.remove('hidden');
        
        // モバイルコントロールを表示
        if (this.mobileControls) {
            this.mobileControls.classList.remove('hidden');
        }
        
        // 音楽再生（ユーザーアクションが必要な場合があるため、try-catch）
        this.playAudio();
        
        this.isPlaying = true;
        this.startTime = performance.now();
    }
    
    async playAudio() {
        try {
            console.log('Attempting to play audio');
            await this.audio.play();
            console.log('Audio started successfully');
        } catch (error) {
            console.error('Audio play error:', error);
            
            // モバイルブラウザなどでユーザーアクションが必要な場合
            if (error.name === 'NotAllowedError') {
                alert('音楽を再生するには画面をタップしてください');
                
                // ユーザーアクションを待つ
                const startAudio = () => {
                    this.audio.play().then(() => {
                        console.log('Audio started after user interaction');
                        document.removeEventListener('click', startAudio);
                        document.removeEventListener('touchstart', startAudio);
                    });
                };
                
                document.addEventListener('click', startAudio, { once: true });
                document.addEventListener('touchstart', startAudio, { once: true });
            }
        }
    }
    
    generateBeatmapFromAudio() {
        const duration = this.audio.duration;
        
        // selectedDifficultyがnullの場合はエラー
        if (!this.selectedDifficulty) {
            console.error('Cannot generate beatmap: no difficulty selected');
            return;
        }
        
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
            // ノーツがターゲットエリア（画面下部）を通り過ぎた場合
            const targetAreaBottom = window.innerHeight - 20; // ターゲットエリアのbottom位置
            const noteBottom = note.element.offsetTop + note.element.offsetHeight;
            
            if (note.element && noteBottom > targetAreaBottom + 100) { // 100pxの余裕を持たせる
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
        
        // ターゲットエリア内のノーツのみを対象にする
        const targetAreaTop = window.innerHeight - 140; // ターゲットエリア上端
        const targetAreaBottom = window.innerHeight - 20; // ターゲットエリア下端
        
        const targetNotes = this.activeNotes.filter(note => 
            note.lane === laneIndex && 
            !note.hit && 
            note.element &&
            note.element.offsetTop >= targetAreaTop - 100 && // 少し余裕を持たせる
            note.element.offsetTop <= targetAreaBottom + 50
        );
        
        if (targetNotes.length === 0) return;
        
        // 最もターゲットエリアに近いノーツを見つける
        let closestNote = null;
        let minDistance = Infinity;
        
        const targetCenter = targetAreaTop + (targetAreaBottom - targetAreaTop) / 2;
        
        targetNotes.forEach(note => {
            const noteCenter = note.element.offsetTop + note.element.offsetHeight / 2;
            const distance = Math.abs(noteCenter - targetCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestNote = note;
            }
        });
        
        if (!closestNote) return;
        
        // 位置ベースのタイミング判定
        const timingWindow = this.getPositionTimingWindow(minDistance);
        if (timingWindow) {
            closestNote.hit = true;
            closestNote.element.remove();
            this.processTimingHit(timingWindow);
        }
    }
    
    getPositionTimingWindow(distance) {
        if (distance <= 20) return 'perfect';
        if (distance <= 40) return 'great';
        if (distance <= 60) return 'good';
        return null;
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
        
        // モバイルコントロールを非表示
        if (this.mobileControls) {
            this.mobileControls.classList.add('hidden');
        }
        
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
    try {
        game = new DDRGame();
        console.log('Game initialized successfully:', game);
        console.log('Top screen element:', game.topScreen);
        console.log('Level select element:', game.levelSelectScreen);
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});

// グローバル関数 - 確実にゲームが初期化されているかチェック
function showLevelSelect() {
    console.log('showLevelSelect called, game:', game);
    
    // ゲームが初期化されていない場合は初期化
    if (!game) {
        console.log('Game not initialized, creating new instance');
        try {
            game = new DDRGame();
            console.log('New game instance created');
        } catch (error) {
            console.error('Failed to create game instance:', error);
            return;
        }
    }
    
    // 要素の存在チェック
    if (game && game.topScreen && game.levelSelectScreen) {
        console.log('Elements found, executing screen transition');
        try {
            game.showLevelSelect();
        } catch (error) {
            console.error('Error during screen transition:', error);
        }
    } else {
        console.error('Required elements not found:', {
            game: !!game,
            topScreen: !!game?.topScreen,
            levelSelectScreen: !!game?.levelSelectScreen
        });
        
        // 直接DOM操作でフォールバック
        console.log('Attempting direct DOM manipulation as fallback');
        const topScreen = document.getElementById('top-screen');
        const levelScreen = document.getElementById('level-select-screen');
        
        if (topScreen && levelScreen) {
            topScreen.classList.add('hidden');
            levelScreen.classList.remove('hidden');
            console.log('Fallback screen transition completed');
        } else {
            console.error('Even direct DOM elements not found!');
        }
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