// Game State
let state = {
    score: 0,
    lives: 3,
    level: 1,
    currentChallengeIndex: 0,
    isPlaying: false,
    challenges: [] // Loaded from GAME_DATA based on level
};

// DOM Elements
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level-display');
const paragraphContainer = document.getElementById('paragraph-container');
const wordBank = document.getElementById('word-bank');
const uiOverlay = document.getElementById('ui-overlay');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverTitle = document.getElementById('game-over-title');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Dictionary Modal Elements
const dictOverlay = document.getElementById('dictionary-overlay');
const dictCloseBtn = document.getElementById('close-dict-btn');
const dictWordEl = document.getElementById('dict-word');
const dictPhoneticEl = document.getElementById('dict-phonetic');
const dictDefsEl = document.getElementById('dict-definitions');
const dictAudioContainer = document.getElementById('dict-audio-container');

// Audio Context for Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function init() {
    // Level Selection Buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = parseInt(e.target.dataset.level);
            if (level) startGame(level);
        });
    });

    restartBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        uiOverlay.classList.remove('hidden');
        uiOverlay.classList.add('active'); // Ensure main overlay is active
    });

    // Close Dictionary Modal
    dictCloseBtn.addEventListener('click', closeDictionary);
    dictOverlay.addEventListener('click', (e) => {
        // Close if clicking outside the modal content
        if (e.target === dictOverlay) closeDictionary();
    });
}

function startGame(level) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    state.level = level;
    state.score = 0;
    state.lives = 3;
    state.currentChallengeIndex = 0;
    state.isPlaying = true;

    // Load challenges for this level
    // Clone to avoid modifying original reference if we want to shuffle later
    if (!GAME_DATA[level]) {
        console.error("Level data not found!");
        return;
    }
    state.challenges = [...GAME_DATA[level]];

    updateUI();
    uiOverlay.classList.remove('active'); // Hide start screen
    loadChallenge();
}

function loadChallenge() {
    if (state.currentChallengeIndex >= state.challenges.length) {
        // Level Complete
        endGame(true);
        return;
    }

    const challenge = state.challenges[state.currentChallengeIndex];

    // 1. Render Text with Drop Zone AND Interactive Words
    // Strategy:
    // 1. Split by [word] to separate drop zones from text chunks.
    // 2. Process text chunks to wrap words in <span>.

    const rawText = challenge.text;
    const parts = rawText.split(/(\[.*?\])/); // Split keeping delimiters

    let htmlContent = "";

    parts.forEach(part => {
        if (part.startsWith('[') && part.endsWith(']')) {
            // It's a drop zone: [word]
            const word = part.slice(1, -1);
            htmlContent += `<span class="drop-zone" data-answer="${word}"></span>`;
        } else {
            // It's normal text. Just append it.
            htmlContent += part;
        }
    });

    paragraphContainer.innerHTML = htmlContent;

    // Add event listeners to Drop Zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });

    // 2. Render Word Bank
    wordBank.innerHTML = '';

    // Collect all words (correct + distractors)
    let allWords = [...challenge.words];
    shuffleArray(allWords);

    allWords.forEach(w => {
        const card = document.createElement('div');
        card.classList.add('word-card');
        card.textContent = w.text;
        card.draggable = true;

        // Drag Events
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        // Dictionary Click Event (Word Bank items are clickable)
        card.addEventListener('click', () => window.openDictionary(w.text));

        wordBank.appendChild(card);
    });
}

// DRAG AND DROP HANDLERS

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('dragging'), 0);
    // e.dataTransfer.setData('text/plain', this.textContent); 
}

function handleDragEnd(e) {
    draggedItem = null;
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    if (this.textContent === "") { // Only allow if empty
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (!draggedItem) return;

    // Check Answer
    const targetWord = this.dataset.answer;
    const droppedWord = draggedItem.textContent;

    if (droppedWord.toLowerCase() === targetWord.toLowerCase()) {
        // Correct!
        handleCorrectMove(this, draggedItem);
    } else {
        // Incorrect
        handleIncorrectMove(this);
    }
}

function handleCorrectMove(zone, card) {
    playSound('success');
    zone.textContent = card.textContent;
    zone.classList.add('correct');

    // Remove card from bank
    card.remove();

    state.score += 100;
    updateUI();

    checkChallengeCompletion();
}

function handleIncorrectMove(zone) {
    playSound('fail');
    zone.classList.add('wrong');
    setTimeout(() => zone.classList.remove('wrong'), 500);

    state.lives--;
    updateUI();

    if (state.lives <= 0) {
        endGame(false);
    }
}

function checkChallengeCompletion() {
    // Check if all drop zones are filled
    const zones = document.querySelectorAll('.drop-zone');
    const allFilled = Array.from(zones).every(z => z.classList.contains('correct'));

    if (allFilled) {
        // Wait a moment then go to next challenge
        setTimeout(() => {
            state.currentChallengeIndex++;
            loadChallenge();
        }, 1500);
    }
}

// DICTIONARY LOGIC
// Attached to window so inline onclick works
window.openDictionary = async function (word) {
    dictOverlay.classList.remove('hidden');
    dictOverlay.classList.add('active'); // CSS requires .active to show
    dictWordEl.textContent = word;
    dictPhoneticEl.textContent = "Loading...";
    dictDefsEl.innerHTML = "Loading definition...";
    dictAudioContainer.innerHTML = ""; // Clear old audio

    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
            const entry = data[0];
            dictPhoneticEl.textContent = entry.phonetic || (entry.phonetics[0] ? entry.phonetics[0].text : "");

            // Audio Logic
            // Iterate through all phonetics to find one with audio
            let audioUrl = null;
            for (const p of entry.phonetics) {
                if (p.audio && p.audio.length > 0) {
                    audioUrl = p.audio;
                    break;
                }
            }

            // Always show Listen button, using TTS as fallback
            const audioBtn = document.createElement('button');
            audioBtn.innerHTML = "🔊 Listen";
            audioBtn.className = "audio-play-btn";

            if (audioUrl) {
                audioBtn.onclick = () => {
                    const a = new Audio(audioUrl);
                    a.play();
                };
            } else {
                // Fallback to Web Speech API
                audioBtn.onclick = () => {
                    const utter = new SpeechSynthesisUtterance(word);
                    utter.rate = 0.8;
                    window.speechSynthesis.speak(utter);
                };
            }
            dictAudioContainer.appendChild(audioBtn);

            // Build definitions HTML
            let defsHtml = "";
            if (entry.meanings) {
                entry.meanings.forEach(m => {
                    defsHtml += `<h3>${m.partOfSpeech}</h3>`;
                    m.definitions.slice(0, 2).forEach(d => {
                        defsHtml += `<p>${d.definition}</p>`;
                    });
                });
            }
            dictDefsEl.innerHTML = defsHtml;
        } else {
            dictDefsEl.textContent = "No definition found.";
            dictPhoneticEl.textContent = "";
        }
    } catch (e) {
        console.error(e);
        dictDefsEl.textContent = "Error loading definition.";
        dictPhoneticEl.textContent = "";
    }
}

function closeDictionary() {
    dictOverlay.classList.add('hidden');
    dictOverlay.classList.remove('active');
}

// UTILS

function updateUI() {
    scoreEl.textContent = `Score: ${state.score}`;
    livesEl.textContent = `Lives: ${state.lives}`;
    levelEl.textContent = `Level: ${state.level}`;
}

function endGame(victory) {
    state.isPlaying = false;
    uiOverlay.classList.remove('hidden');
    uiOverlay.classList.add('active');

    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    gameOverTitle.textContent = victory ? "Level Complete!" : "Game Over";
    finalScoreEl.textContent = `Final Score: ${state.score}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'success') {
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// Init
init();
