class DDRGame {
    constructor() {
        this.audio = document.getElementById('game-audio');
        this.gameArea = document.getElementById('game-area');
        this.topScreen = document.getElementById('top-screen');
        this.levelSelectScreen = document.getElementById('level-select-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.niceHits = 0;
        this.missHits = 0;
        this.hp = 100;
        this.maxHp = 100;
        
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
                speed: 1.8, 
                noteFrequency: 0.3, 
                complexity: 0.5,
                level: 1,
                name: 'Easy',
                color: '#4CAF50'
            },
            normal: { 
                speed: 2.5, 
                noteFrequency: 0.5, 
                complexity: 0.8,
                level: 2,
                name: 'Normal',
                color: '#FF9800'
            },
            hard: { 
                speed: 3.5, 
                noteFrequency: 0.7, 
                complexity: 1.2,
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
        const beatInterval = 60 / bpm; // 約0.43秒
        
        this.notes = [];
        
        // 適度な間隔でノーツを生成
        for (let time = 1.0; time < duration; time += beatInterval * 0.8) { // 1秒から開始、より間隔を空ける
            if (Math.random() < difficulty.noteFrequency) {
                // 単体ノーツ
                const lane = Math.floor(Math.random() * 4);
                this.notes.push({
                    time: time,
                    lane: lane,
                    type: 'single',
                    spawned: false,
                    hit: false,
                    passedCheck: false
                });
            }
            
            // より高い難易度では同時押しを追加（確率を大幅に下げる）
            if (difficulty.complexity > 1.0 && Math.random() < 0.05) {
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
                        hit: false,
                        passedCheck: false
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
        console.log('=== selectLevelAndStart called ===');
        console.log('Difficulty selected:', difficulty);
        this.selectedDifficulty = difficulty;
        console.log('Selected difficulty set to:', this.selectedDifficulty);
        this.startGame();
    }
    
    startGame() {
        console.log('=== startGame called ===');
        console.log('selectedSong:', this.selectedSong);
        console.log('selectedDifficulty:', this.selectedDifficulty);
        
        if (!this.selectedSong || !this.selectedDifficulty) {
            alert('楽曲と難易度を選択してください');
            return;
        }
        
        console.log('=== Game initialization ===');
        
        // 全ステータスをリセット
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.niceHits = 0;
        this.missHits = 0;
        this.hp = this.maxHp; // HPを必ず最大値にリセット
        this.activeNotes = [];
        
        console.log('Game started with HP reset to:', this.hp);
        
        console.log('=== Generating beatmap ===');
        // まず固定時間でビートマップを生成
        this.generateBeatmap();
        console.log('Initial beatmap generated with', this.notes.length, 'notes');
        console.log('First 5 notes:', this.notes.slice(0, 5));
        
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
        console.log('=== startGameplay called ===');
        console.log('Notes available:', this.notes.length);
        console.log('Game area visible:', !this.gameArea.classList.contains('hidden'));
        console.log('Initial HP:', this.hp);
        
        this.isPlaying = true;
        this.startTime = performance.now();
        this.updateUI();
        
        // 音楽を再生（可能な場合）
        if (this.audio.src && !this.audio.error) {
            this.audio.play().catch(e => {
                console.warn('Audio play failed:', e);
            });
        }
        
        console.log('=== Starting game loop ===');
        this.gameLoop();
    }
    
    generateBeatmapFromAudio() {
        const duration = this.audio.duration || 180;
        
        // ランダムビートマップ生成
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        this.notes = [];
        
        // 適度な間隔でノーツを生成
        for (let time = 1.0; time < duration - 2; time += 0.4) {
            if (Math.random() < difficulty.noteFrequency) {
                // 基本ノーツ
                const lane = Math.floor(Math.random() * 4);
                this.notes.push({
                    time: time,
                    lane: lane,
                    type: 'single',
                    spawned: false,
                    hit: false,
                    passedCheck: false
                });
                
                // 複雑な難易度では追加パターン（確率を下げる）
                if (difficulty.complexity > 1.0 && Math.random() < 0.1) {
                    const patterns = this.getPatterns(difficulty.complexity, time + 0.1);
                    patterns.forEach(note => {
                        note.spawned = false;
                        note.hit = false;
                        this.notes.push(note);
                    });
                }
            }
        }
        
        this.notes.sort((a, b) => a.time - b.time);
        this.totalNotes = this.notes.length;
        console.log('Beatmap generation completed:', this.totalNotes, 'notes');
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
                type: 'single',
                spawned: false,
                hit: false,
                passedCheck: false
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
        if (!this.isPlaying) {
            console.log('Game loop stopped - isPlaying:', this.isPlaying);
            return;
        }
        
        // ゲームループ実行の確認（最初の10秒のみ）
        const currentTime = this.audio.currentTime || (performance.now() - this.startTime) / 1000;
        if (currentTime < 10) {
            console.log('Game loop running at time:', currentTime.toFixed(2));
        }
        
        this.spawnNotes();
        this.updateNotes();
        this.cleanupNotes();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    spawnNotes() {
        // 音楽がない場合は経過時間を使用
        const currentTime = this.audio.currentTime || (performance.now() - this.startTime) / 1000;
        const spawnTime = 2; // 2秒前にスポーン（より早く表示）
        
        if (this.notes.length === 0) {
            console.log('No notes available to spawn!');
            return;
        }
        
        let spawnedCount = 0;
        let shouldSpawnCount = 0;
        
        this.notes.forEach((note, index) => {
            if (!note.spawned && note.time - currentTime <= spawnTime) {
                shouldSpawnCount++;
                this.createNoteElement(note);
                note.spawned = true;
                spawnedCount++;
            }
        });
        
        if (shouldSpawnCount > 0) {
            console.log('Time:', currentTime.toFixed(2), 'Should spawn:', shouldSpawnCount, 'Actually spawned:', spawnedCount);
        }
        
        // 最初の10秒間は詳細ログ
        if (currentTime < 10) {
            const unspawnedNotes = this.notes.filter(n => !n.spawned);
            console.log('Unspawned notes remaining:', unspawnedNotes.length);
            if (unspawnedNotes.length > 0) {
                console.log('Next note time:', unspawnedNotes[0].time, 'Current time:', currentTime, 'Diff:', unspawnedNotes[0].time - currentTime);
            }
        }
    }
    
    createNoteElement(note) {
        console.log('Creating note element for lane', note.lane, 'at time', note.time);
        
        const noteElement = document.createElement('div');
        noteElement.className = `note ${this.lanes[note.lane]}`;
        
        // 矢印ノーツに変更
        const arrows = ['←', '↓', '↑', '→'];
        noteElement.textContent = arrows[note.lane];
        noteElement.style.color = 'white';
        noteElement.style.textShadow = '0 0 15px white';
        noteElement.style.fontSize = '50px';
        noteElement.style.fontWeight = 'bold';
        
        const lanes = document.querySelectorAll('.lane');
        console.log('Found lanes:', lanes.length);
        
        if (lanes.length === 0) {
            console.error('No lanes found! Game area may not be visible');
            return;
        }
        
        const lane = lanes[note.lane];
        if (!lane) {
            console.error('Lane not found for index:', note.lane);
            return;
        }
        
        lane.appendChild(noteElement);
        console.log('Note element added to lane', note.lane);
        
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        const fallDuration = 3000 / difficulty.speed;
        
        noteElement.style.animationDuration = `${fallDuration}ms`;
        
        note.element = noteElement;
        note.spawnTime = performance.now();
        note.hit = false; // 確実にfalseに設定
        note.passedCheck = false; // 確実にfalseに設定
        this.activeNotes.push(note);
        
        console.log('Note created! Lane:', note.lane, 'Arrow:', this.getArrowForLane(note.lane), 'Active notes:', this.activeNotes.length);
    }
    
    updateNotes() {
        // より確実なリアルタイム通過判定
        const targetAreas = document.querySelectorAll('.target-area');
        console.log('updateNotes called, active notes:', this.activeNotes.length);
        
        let notesToRemove = [];
        
        this.activeNotes.forEach((note, index) => {
            if (note.element && !note.hit && !note.passedCheck) {
                const noteRect = note.element.getBoundingClientRect();
                
                if (targetAreas[note.lane]) {
                    const targetRect = targetAreas[note.lane].getBoundingClientRect();
                    
                    // より寛大な通過判定：ターゲットエリアの下端を通過
                    const passThreshold = targetRect.bottom + 20;
                    const notePassed = noteRect.top > passThreshold;
                    
                    console.log(`Note ${index} in lane ${note.lane} (${this.getArrowForLane(note.lane)}): 
                        noteTop=${noteRect.top.toFixed(1)}, 
                        passThreshold=${passThreshold.toFixed(1)}, 
                        passed=${notePassed}`);
                    
                    if (notePassed) {
                        console.log('🚫 NOTE MISSED! Arrow:', this.getArrowForLane(note.lane), 'Lane:', note.lane);
                        note.hit = true;
                        note.passedCheck = true;
                        this.processMiss();
                        
                        // ノーツを削除対象に追加
                        notesToRemove.push(note);
                    }
                } else {
                    console.log('No target area found for lane:', note.lane);
                }
            }
        });
        
        // 通過したノーツを削除
        notesToRemove.forEach(note => {
            if (note.element) {
                note.element.remove();
            }
        });
        
        // アクティブノーツリストから除去
        this.activeNotes = this.activeNotes.filter(note => !note.passedCheck);
        
        console.log('Remaining active notes:', this.activeNotes.length);
    }
    
    cleanupNotes() {
        const targetAreas = document.querySelectorAll('.target-area');
        
        this.activeNotes = this.activeNotes.filter(note => {
            if (note.element) {
                const noteRect = note.element.getBoundingClientRect();
                const targetRect = targetAreas[note.lane] ? targetAreas[note.lane].getBoundingClientRect() : null;
                
                // ノーツがターゲットエリアを通過した場合（下端+100pxを基準）
                let missThreshold = window.innerHeight;
                if (targetRect) {
                    missThreshold = targetRect.bottom + 100; // ターゲット下端から100px下
                }
                
                if (noteRect.top > missThreshold) {
                    if (!note.hit) {
                        console.log('Note passed target area without input - MISS! Lane:', note.lane, 'Direction:', this.getArrowForLane(note.lane));
                        this.processMiss();
                    }
                    note.element.remove();
                    return false;
                }
                
                // さらに厳しく：ノーツがターゲットエリアより下にある場合も判定
                if (targetRect && !note.hit && noteRect.top > targetRect.bottom + 50) {
                    console.log('Note passed judgment zone - MISS! Lane:', note.lane);
                    note.hit = true; // 重複Miss防止
                    this.processMiss();
                    note.element.remove();
                    return false;
                }
            }
            return true;
        });
    }
    
    getArrowForLane(laneIndex) {
        const arrows = ['←', '↓', '↑', '→'];
        return arrows[laneIndex] || '?';
    }
    
    handleKeyPress(e) {
        if (e.key === 'Escape') {
            this.returnToMenu();
            return;
        }
        
        if (!this.isPlaying) return;
        
        console.log('Key pressed:', e.key);
        
        // キーがマッピングされていない場合はMiss
        if (!this.keyMap[e.key]) {
            console.log('Invalid key pressed:', e.key, '- MISS!');
            this.processMiss();
            return;
        }
        
        const direction = this.keyMap[e.key];
        const laneIndex = this.lanes.indexOf(direction);
        
        console.log('Mapped to direction:', direction, 'lane:', laneIndex);
        
        this.processHit(laneIndex);
        this.addVisualFeedback(laneIndex);
    }
    
    handleKeyRelease(e) {
        // キー離し時の処理
    }
    
    processHit(laneIndex) {
        console.log('=== Key pressed for lane:', laneIndex, 'Direction:', this.lanes[laneIndex]);
        const currentTime = this.audio.currentTime || (performance.now() - this.startTime) / 1000;
        
        // 現在のレーンにあるヒットしていないノーツを取得
        const targetNotes = this.activeNotes.filter(note => 
            note.lane === laneIndex && !note.hit
        );
        
        console.log('Available notes in lane:', targetNotes.length);
        
        if (targetNotes.length === 0) {
            // タイミング外のキー入力 - 必ずMiss
            console.log('No notes available in lane', laneIndex, '- FORCED MISS!');
            this.processMiss();
            return;
        }
        
        // ターゲットエリア付近のノーツのみ判定対象にする
        let validNotes = [];
        const targetAreas = document.querySelectorAll('.target-area');
        
        if (targetAreas[laneIndex]) {
            const targetRect = targetAreas[laneIndex].getBoundingClientRect();
            
            targetNotes.forEach(note => {
                if (note.element) {
                    const noteRect = note.element.getBoundingClientRect();
                    const positionDiff = Math.abs(noteRect.bottom - targetRect.bottom);
                    
                    // ターゲットエリア付近（150px以内）のノーツのみ対象
                    if (positionDiff <= 150) {
                        validNotes.push({note, positionDiff});
                        console.log('Valid note found at distance:', positionDiff);
                    }
                }
            });
        }
        
        if (validNotes.length === 0) {
            // 近くにノーツがない場合はMiss
            console.log('No valid notes near target - MISS!');
            this.processMiss();
            return;
        }
        
        // 最も近いノーツを選択
        validNotes.sort((a, b) => a.positionDiff - b.positionDiff);
        const {note: closestNote, positionDiff: minPositionDiff} = validNotes[0];
        
        const timingWindow = this.getPositionTimingWindow(minPositionDiff);
        if (timingWindow) {
            closestNote.hit = true;
            closestNote.element.remove();
            this.processTimingHit(timingWindow);
            console.log('Hit:', timingWindow, 'at position diff:', minPositionDiff);
        } else {
            // 判定範囲外の場合はMiss
            console.log('MISS! Position diff was too large:', minPositionDiff);
            closestNote.hit = true;
            closestNote.element.remove();
            this.processMiss();
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
        // さらに厳しい4段階判定（ピクセル単位での判定）
        console.log('Checking position diff:', positionDiff);
        if (positionDiff <= 15) {
            console.log('-> PERFECT');
            return 'perfect';
        }
        if (positionDiff <= 30) {
            console.log('-> GOOD');  
            return 'good';
        }
        if (positionDiff <= 50) {
            console.log('-> NICE');
            return 'nice';
        }
        console.log('-> MISS (position diff too large)');
        return null; // 範囲外はMissとして処理
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
                this.hp = Math.min(this.maxHp, this.hp + 3); // Perfect で HP回復
                break;
            case 'good':
                this.goodHits++;
                points = 600;
                color = 'good';
                this.combo++;
                this.hp = Math.min(this.maxHp, this.hp + 1); // Good で HP少し回復
                break;
            case 'nice':
                this.niceHits = (this.niceHits || 0) + 1;
                points = 300;
                color = 'nice';
                this.combo++;
                // Niceは HP変化なし
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
        console.log('🔴🔴🔴 MISS DETECTED! 🔴🔴🔴');
        console.log('=== PROCESSING MISS ===');
        this.missHits++;
        this.combo = 0;
        const oldHp = this.hp;
        this.hp -= 5; // ミスでHPを5減少
        console.log('✨ Miss processed! HP:', oldHp, '→', this.hp, 'Total misses:', this.missHits);
        console.log('🔴🔴🔴 MISS COMPLETE 🔴🔴🔴');
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
            ((this.perfectHits + this.goodHits * 0.8 + (this.niceHits || 0) * 0.5) / this.hitNotes) * 100 : 100;
        document.getElementById('accuracy').textContent = accuracy.toFixed(1) + '%';
        
        // HP更新
        this.updateHP();
    }
    
    updateHP() {
        const hpPercentage = Math.max(0, this.hp / this.maxHp * 100);
        const hpFill = document.getElementById('hp-fill');
        const hpValue = document.getElementById('hp-value');
        
        if (hpFill && hpValue) {
            hpFill.style.width = hpPercentage + '%';
            hpValue.textContent = Math.floor(this.hp);
            
            // HP状態に応じて色を変更
            hpFill.classList.remove('low', 'critical');
            if (hpPercentage <= 20) {
                hpFill.classList.add('critical');
                console.log('HP CRITICAL! Current HP:', this.hp);
            } else if (hpPercentage <= 40) {
                hpFill.classList.add('low');
                console.log('HP LOW! Current HP:', this.hp);
            }
        }
        
        // HPが0以下になったらゲームオーバー
        if (this.hp <= 0) {
            console.log('HP DEPLETED! GAME OVER!');
            this.gameOver();
        }
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
    
    gameOver() {
        console.log('=== GAME OVER ===');
        this.isPlaying = false;
        this.audio.pause();
        
        // 統計を表示
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        // 画面遷移
        this.gameArea.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        // 統計データを更新
        const accuracy = this.hitNotes > 0 ? 
            ((this.perfectHits + this.goodHits * 0.8 + (this.niceHits || 0) * 0.5) / this.hitNotes) * 100 : 0;
        
        document.getElementById('final-score').textContent = Math.floor(this.score);
        document.getElementById('final-combo').textContent = this.maxCombo;
        document.getElementById('final-accuracy').textContent = accuracy.toFixed(1) + '%';
        document.getElementById('final-perfect').textContent = this.perfectHits;
        document.getElementById('final-great').textContent = this.goodHits; // Great→Good
        document.getElementById('final-good').textContent = this.niceHits || 0; // Good→Nice
        document.getElementById('final-nice').textContent = 0; // 使用しない
        document.getElementById('final-bad').textContent = 0; // 使用しない
        document.getElementById('final-miss').textContent = this.missHits;
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
        console.log('resetGame called - HP before reset:', this.hp);
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.niceHits = 0;
        this.missHits = 0;
        this.hp = this.maxHp; // HPを最大値にリセット
        this.notes = [];
        this.activeNotes = [];
        
        console.log('resetGame complete - HP after reset:', this.hp);
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

// デバッグ情報とテスト関数
console.log('DDR Rhythm Game が読み込まれました！');
console.log('ファイルバージョン: 2024-09-06-v2');

// テスト関数
function testNoteCreation() {
    console.log('=== Manual Note Creation Test ===');
    if (game && game.selectedDifficulty) {
        console.log('Game instance found, creating test note...');
        const testNote = {
            time: 0,
            lane: 0,
            type: 'single',
            spawned: false,
            hit: false
        };
        game.createNoteElement(testNote);
    } else {
        console.log('Game not ready. Current state:', {
            game: !!game,
            difficulty: game?.selectedDifficulty,
            isPlaying: game?.isPlaying
        });
    }
}

// グローバルに公開
window.testNoteCreation = testNoteCreation;

// ミス処理テスト関数
function testMiss() {
    console.log('=== Manual Miss Test ===');
    if (game) {
        game.processMiss();
        console.log('Manual miss processed');
    } else {
        console.log('Game not ready');
    }
}

function debugActiveNotes() {
    console.log('=== Active Notes Debug ===');
    if (game && game.activeNotes) {
        console.log('Total active notes:', game.activeNotes.length);
        game.activeNotes.forEach((note, i) => {
            console.log(`Note ${i}: Lane ${note.lane} (${game.getArrowForLane(note.lane)}), Hit: ${note.hit}, PassedCheck: ${note.passedCheck}`);
        });
    }
}

window.testMiss = testMiss;
window.debugActiveNotes = debugActiveNotes;

// ゲームオーバー画面のボタン機能
function restartGame() {
    console.log('restartGame called');
    if (game) {
        console.log('Resetting HP from', game.hp, 'to', game.maxHp);
        // HPを完全にリセット
        game.hp = game.maxHp;
        
        // ゲームオーバー画面を隠す
        game.gameOverScreen.classList.add('hidden');
        
        // 現在の難易度で再開
        game.selectLevelAndStart(game.selectedDifficulty);
        
        console.log('Game restarted with HP:', game.hp);
    }
}

function backToMenu() {
    console.log('backToMenu called');
    if (game) {
        console.log('Resetting HP for menu return from', game.hp, 'to', game.maxHp);
        // HPを完全にリセット
        game.hp = game.maxHp;
        
        // ゲームオーバー画面を隠す
        game.gameOverScreen.classList.add('hidden');
        
        // メニューに戻る
        game.showTopScreen();
        
        // UIも更新してHPバーを正常に表示
        game.updateUI();
        
        console.log('Returned to menu with HP:', game.hp);
    }
}

// グローバルに公開
window.restartGame = restartGame;
window.backToMenu = backToMenu;