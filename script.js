// Game State
let state = {
    score: 0,
    lives: 3,
    level: 1,
    currentChallengeIndex: 0,
    isPlaying: false,
    challenges: [], // Loaded from GAME_DATA based on level
    accessibilityMode: false
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
const startOverBtn = document.getElementById('start-over-btn');
const accessibilityToggle = document.getElementById('accessibility-toggle');

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

    startOverBtn.addEventListener('click', resetToLevelSelection);

    // Accessibility Toggle Initial State & Handler
    accessibilityToggle.checked = false;
    accessibilityToggle.addEventListener('change', (e) => {
        state.accessibilityMode = e.target.checked;
        if (state.isPlaying && state.accessibilityMode) {
            speakChallengeText();
        } else {
            window.speechSynthesis.cancel();
        }
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
    startOverBtn.classList.remove('hidden'); // Show start over button
    loadChallenge();
}

function resetToLevelSelection() {
    state.isPlaying = false;
    startOverBtn.classList.add('hidden');
    window.speechSynthesis.cancel(); // Stop TTS speech
    
    uiOverlay.classList.remove('hidden');
    uiOverlay.classList.add('active');
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    
    paragraphContainer.innerHTML = 'Select a level to start...';
    wordBank.innerHTML = '';
}

function speakChallengeText() {
    if (!state.isPlaying) return;
    const challenge = state.challenges[state.currentChallengeIndex];
    if (!challenge) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Replace drop zone [word] with a distinct pause, the word "blank", and another pause
    const textToSpeak = challenge.text.replace(/\[.*?\]/g, ', ... blank ... ,');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function submitWord(droppedWord, card) {
    const zone = document.querySelector('.drop-zone');
    if (!zone) return;

    const targetWord = zone.dataset.answer;
    if (droppedWord.toLowerCase() === targetWord.toLowerCase()) {
        handleCorrectMove(zone, card);
    } else {
        handleIncorrectMove(zone);
    }
}

function loadChallenge() {
    if (state.currentChallengeIndex >= state.challenges.length) {
        // Level Complete
        endGame(true);
        return;
    }

    const challenge = state.challenges[state.currentChallengeIndex];

    // 1. Render Text with Drop Zone AND Interactive Words
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
        card.tabIndex = 0; // Support keyboard focus

        // Drag Events
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        // Left-click submits the word
        card.addEventListener('click', () => {
            submitWord(w.text, card);
        });

        // Right-click opens dictionary popup
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent default browser context menu
            window.openDictionary(w.text);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitWord(w.text, card);
            }
        });

        wordBank.appendChild(card);
    });

    // Read text out loud if accessibility mode is active
    if (state.accessibilityMode) {
        speakChallengeText();
    }
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

    // Speak "Correct: (Word)" if accessibility mode is ON
    if (state.accessibilityMode) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(`Correct: ${card.textContent}`);
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
    }

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
const PRONUNCIATION_MAP = {
    // Level 1
    "password": "/ PAS-wurd /",
    "username": "/ YOO-zer-naym /",
    "login": "/ LAWG-in /",
    "logout": "/ LAWG-owt /",
    "account": "/ uh-KOWNT /",
    "virus": "/ VY-ruhs /",
    "malware": "/ MAL-wair /",
    "hacker": "/ HAK-er /",
    "phishing": "/ FISH-ing /",
    "spam": "/ SPAM /",
    "scam": "/ SKAM /",
    "link": "/ LINK /",
    "download": "/ DOWN-lohd /",
    "update": "/ UP-dayt /",
    "backup": "/ BAK-up /",
    "wifi": "/ WY-fy /",
    "router": "/ ROW-ter /",
    "internet": "/ IN-ter-net /",
    "browser": "/ BROW-zer /",
    "website": "/ WEB-syt /",
    "firewall": "/ FYR-wawl /",
    "antivirus": "/ an-tee-VY-ruhs /",
    "email": "/ EE-mayl /",
    "attachment": "/ uh-TACH-muhnt /",
    "popup": "/ POP-up /",
    "privacy": "/ PRY-vuh-see /",
    "security": "/ si-KYOO-ri-tee /",
    "data": "/ DAY-tuh /",
    "device": "/ di-VYS /",
    "phone": "/ FOHN /",
    "laptop": "/ LAP-top /",
    "desktop": "/ DESK-top /",
    "tablet": "/ TAB-lit /",
    "bluetooth": "/ BLOO-tooth /",
    "cloud": "/ KLOWD /",
    "storage": "/ STOR-ij /",
    "folder": "/ FOHL-der /",
    "file": "/ FYL /",
    "delete": "/ di-LEET /",
    "restore": "/ ri-STOR /",
    "safe": "/ SAYF /",
    "danger": "/ DAYN-jer /",
    "warning": "/ WAWR-ning /",
    "alert": "/ uh-LURT /",
    "lock": "/ LOK /",
    "unlock": "/ un-LOK /",
    "settings": "/ SET-ingz /",
    "app": "/ AP /",
    "software": "/ SOFT-wair /",
    "hardware": "/ HARD-wair /",
    "manager": "/ MAN-i-jer /",
    "computer": "/ kuhm-PYOO-ter /",
    "pet": "/ PET /",
    "chair": "/ CHAIR /",
    "break": "/ BRAYK /",
    "sell": "/ SEL /",
    "paint": "/ PAYNT /",

    // Level 2
    "encryption": "/ en-KRIP-shuhn /",
    "decryption": "/ dee-KRIP-shuhn /",
    "authentication": "/ aw-then-ti-KAY-shuhn /",
    "authorization": "/ aw-thuh-ri-ZAY-shuhn /",
    "breach": "/ BREECH /",
    "vulnerability": "/ vul-ner-uh-BIL-i-tee /",
    "exploit": "/ EKS-ployt /",
    "patch": "/ PACH /",
    "ransomware": "/ RAN-suhm-wair /",
    "spyware": "/ SPY-wair /",
    "adware": "/ AD-wair /",
    "trojan": "/ TROH-juhn /",
    "worm": "/ WURM /",
    "botnet": "/ BOT-net /",
    "spoofing": "/ SPOOF-ing /",
    "sniffing": "/ SNIF-ing /",
    "keylogger": "/ KEE-lawg-er /",
    "rootkit": "/ ROOT-kit /",
    "payload": "/ PAY-lohd /",
    "threat": "/ THRET /",
    "risk": "/ RISK /",
    "attack": "/ uh-TAK /",
    "defense": "/ di-FENS /",
    "mitigation": "/ mit-i-GAY-shuhn /",
    "incident": "/ IN-si-duhnt /",
    "response": "/ ri-SPONS /",
    "recovery": "/ ri-KUV-uh-ree /",
    "forensics": "/ fuh-REN-siks /",
    "monitoring": "/ MON-i-ter-ing /",
    "logging": "/ LAWG-ing /",
    "alerting": "/ uh-LURT-ing /",
    "detection": "/ di-TEK-shuhn /",
    "prevention": "/ pri-VEN-shuhn /",
    "filter": "/ FIL-ter /",
    "block": "/ BLOK /",
    "allow": "/ uh-LOW /",
    "scan": "/ SKAN /",
    "quarantine": "/ KWAWR-uhn-teen /",
    "sandbox": "/ SAND-boks /",
    "signature": "/ SIG-nuh-cher /",
    "heuristic": "/ hyoo-RIS-tik /",
    "proxy": "/ PROK-see /",
    "vpn": "/ VEE-PEE-EN /",
    "gateway": "/ GAYT-way /",
    "endpoint": "/ END-poynt /",
    "firmware": "/ FURM-wair /",
    "fishing": "/ FISH-ing /",
    "spamming": "/ SPAM-ing /",
    "calling": "/ KAWL-ing /",
    "application": "/ ap-li-KAY-shuhn /",
    "automation": "/ aw-tuh-MAY-shuhn /",
    "deletion": "/ di-LEE-shuhn /",
    "corruption": "/ kuh-RUP-shuhn /",
    "connection": "/ kuh-NEK-shuhn /",
    "waterfall": "/ WAW-ter-fawl /",
    "brickwall": "/ BRIK-wawl /",
    "fireball": "/ FYR-bawl /",

    // Level 3
    "server": "/ SUR-ver /",
    "client": "/ KLY-uhnt /",
    "host": "/ HOHST /",
    "ip": "/ EYE-PEE /",
    "mac": "/ MAK /",
    "dns": "/ DEE-EN-ES /",
    "dhcp": "/ DEE-AYCH-CEE-PEE /",
    "tcp": "/ TEE-CEE-PEE /",
    "udp": "/ YOO-DEE-PEE /",
    "http": "/ AYCH-TEE-TEE-PEE /",
    "https": "/ AYCH-TEE-TEE-PEE-ES /",
    "ftp": "/ EF-TEE-PEE /",
    "ssh": "/ ES-ES-AYCH /",
    "rdp": "/ AR-DEE-PEE /",
    "smtp": "/ ES-EM-TEE-PEE /",
    "port": "/ PORT /",
    "packet": "/ PAK-it /",
    "protocol": "/ PROH-tuh-kol /",
    "subnet": "/ SUB-net /",
    "switch": "/ SWITCH /",
    "accesspoint": "/ AK-ses poynt /",
    "nat": "/ NAT /",
    "lan": "/ LAN /",
    "wan": "/ WAN /",
    "vlan": "/ VEE-lan /",
    "sniffer": "/ SNIF-er /",
    "ids": "/ EYE-DEE-ES /",
    "ips": "/ EYE-PEE-ES /",
    "siem": "/ SIM /",
    "log": "/ LAWG /",
    "traffic": "/ TRAF-ik /",
    "bandwidth": "/ BAND-width /",
    "latency": "/ LAY-tuhn-see /",
    "throughput": "/ THROO-poot /",
    "reverseproxy": "/ ri-VURS prok-see /",
    "loadbalancer": "/ LOHD bal-uhn-ser /",
    "certificate": "/ ser-TIF-i-kit /",
    "ssl": "/ ES-ES-EL /",
    "tls": "/ TEE-EL-ES /",
    "handshake": "/ HAND-shayk /",
    "session": "/ SESH-uhn /",
    "timeout": "/ TYM-owt /",
    "segmentation": "/ seg-muhn-TAY-shuhn /",
    "hardening": "/ HAHR-duhn-ing /",
    "baseline": "/ BAYS-lyn /",
    "configuration": "/ kuhn-fig-yuh-RAY-shuhn /",
    "strength": "/ STRENGKTH /",
    "durability": "/ door-uh-BIL-i-tee /",
    "capability": "/ kay-puh-BIL-i-tee /",
    "vulnerabilities": "/ vul-ner-uh-BIL-i-teez /",
    "updates": "/ UP-dayts /",
    "features": "/ FEE-cherz /",
    "users": "/ YOO-zerz /",
    "engineering": "/ en-juh-NEER-ing /",
    "marketing": "/ MAHR-ki-ting /",
    "networking": "/ NET-wur-king /",
    "gathering": "/ GATH-er-ing /"
};

function getPronunciation(word, ipa) {
    const w = word.toLowerCase().trim();
    if (PRONUNCIATION_MAP[w]) {
        return PRONUNCIATION_MAP[w];
    }
    if (ipa) {
        return ipaToRespelling(ipa);
    }
    return "";
}

function ipaToRespelling(ipa) {
    if (!ipa) return "";
    let s = ipa.replace(/^\/|\/$/g, '');
    
    // Syllable replacements
    s = s.replace(/dʒ/g, 'j');
    s = s.replace(/tʃ/g, 'ch');
    s = s.replace(/ʃ/g, 'sh');
    s = s.replace(/ʒ/g, 'zh');
    s = s.replace(/θ/g, 'th');
    s = s.replace(/ð/g, 'th');
    s = s.replace(/ŋ/g, 'ng');
    s = s.replace(/j/g, 'y');
    
    s = s.replace(/aɪ/g, 'y');
    s = s.replace(/aʊ/g, 'ow');
    s = s.replace(/eɪ/g, 'ay');
    s = s.replace(/ɔɪ/g, 'oy');
    s = s.replace(/oʊ|əʊ/g, 'oh');
    s = s.replace(/ɪə/g, 'eer');
    s = s.replace(/ɛə/g, 'air');
    s = s.replace(/ʊə/g, 'oor');
    
    s = s.replace(/æ/g, 'a');
    s = s.replace(/ɑː|aː/g, 'ah');
    s = s.replace(/ɒ/g, 'o');
    s = s.replace(/ɔː/g, 'aw');
    s = s.replace(/ɛ/g, 'e');
    s = s.replace(/ɜː|əː/g, 'ur');
    s = s.replace(/ɪ/g, 'i');
    s = s.replace(/iː/g, 'ee');
    s = s.replace(/ʊ/g, 'oo');
    s = s.replace(/uː/g, 'oo');
    s = s.replace(/ʌ|ə/g, 'uh');
    
    s = s.replace(/ˈ|ˌ/g, '');
    return `/ ${s.toUpperCase()} /`;
}

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
            const rawPhonetic = entry.phonetic || (entry.phonetics[0] ? entry.phonetics[0].text : "");
            dictPhoneticEl.textContent = getPronunciation(word, rawPhonetic);

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
    levelEl.textContent = `Level: ${state.level}`;

    // Update strikes (misses)
    const misses = 3 - state.lives;
    const strikeBoxes = document.querySelectorAll('.strike-box');
    strikeBoxes.forEach((box, index) => {
        if (index < misses) {
            box.classList.add('active');
            box.textContent = 'X';
        } else {
            box.classList.remove('active');
            box.textContent = '';
        }
    });
}

function endGame(victory) {
    state.isPlaying = false;
    startOverBtn.classList.add('hidden'); // Hide start over button
    window.speechSynthesis.cancel(); // Stop TTS speech
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
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            playOscillator(type);
        }).catch(err => console.error("Audio Context Resume failed:", err));
    } else {
        playOscillator(type);
    }
}

function playOscillator(type) {
    try {
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
    } catch (e) {
        console.error("Play oscillator failed:", e);
    }
}

// Init
init();
