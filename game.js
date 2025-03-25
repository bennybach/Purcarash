const gameContainer = document.getElementById('game-container');
const car = document.getElementById('car');
const obstaclesDiv = document.getElementById('obstacles');
const burgersDiv = document.getElementById('burgers');
const scoreDisplay = document.getElementById('score');
const road = document.getElementById('road');
const grass = document.getElementById('grass');
const trees = document.getElementById('trees');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const playerNameInput = document.getElementById('player-name');
const scoreList = document.getElementById('score-list');
const endScreen = document.getElementById('end-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const musicToggle = document.getElementById('music-toggle');
const bgm1 = document.getElementById('bgm1');
const bgm2 = document.getElementById('bgm2');
const bgm3 = document.getElementById('bgm3');

let score = 0;
let isJumping = false;
let gameOver = false;
let lastObstacleTime = 0;
const minObstacleGap = 2000;
let roadPos = 0;
let treesPos = 0;
let playerName = '';
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let speedMultiplier = 1;
let lastSpeedIncrease = 0;
let musicPlaying = false;
let currentTrack = 0;
const tracks = [bgm1, bgm2, bgm3];

let spacePressed = false;

function updateScoreboard() {
    scoreList.innerHTML = '';
    highScores.sort((a, b) => b.score - a.score).slice(0, 10).forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
        scoreList.appendChild(li);
    });
}

function saveScore() {
    highScores.push({ name: playerName || 'Anonymous', score: score });
    localStorage.setItem('highScores', JSON.stringify(highScores));
    updateScoreboard();
}

function resetGame() {
    score = 0;
    isJumping = false;
    gameOver = false;
    lastObstacleTime = 0;
    roadPos = 0;
    treesPos = 0;
    speedMultiplier = 1;
    lastSpeedIncrease = Date.now();
    scoreDisplay.textContent = 'Score: 0';
    car.style.bottom = '75px';
    obstaclesDiv.innerHTML = '';
    burgersDiv.innerHTML = '';
    endScreen.style.display = 'none';
}

function playNextTrack() {
    if (musicPlaying) {
        tracks.forEach(track => track.pause()); // Pause all tracks
        tracks[currentTrack].currentTime = 0; // Reset current track
        tracks[currentTrack].play();
        currentTrack = (currentTrack + 1) % tracks.length; // Move to next track
    }
}

function startMusic() {
    if (!musicPlaying) {
        musicPlaying = true;
        playNextTrack();
        tracks.forEach(track => {
            track.addEventListener('ended', playNextTrack); // Play next when current ends
        });
    }
}

function toggleMusic() {
    if (musicPlaying) {
        tracks.forEach(track => track.pause());
        musicToggle.textContent = 'Enable Music';
        musicPlaying = false;
    } else {
        musicPlaying = true;
        playNextTrack();
        musicToggle.textContent = 'Disable Music';
    }
}

startButton.addEventListener('click', () => {
    playerName = playerNameInput.value.trim();
    if (!playerName) playerName = 'Anonymous';
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    startMusic();
    gameLoop();
});

restartButton.addEventListener('click', () => {
    resetGame();
    gameLoop();
});

musicToggle.addEventListener('click', toggleMusic);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isJumping && !gameOver && !spacePressed) {
        jump();
        spacePressed = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') spacePressed = false;
});

function jump() {
    isJumping = true;
    car.style.bottom = '225px';
    setTimeout(() => {
        car.style.bottom = '75px';
        isJumping = false;
    }, 800);
}

function spawnItem(type) {
    let item;
    if (type === 'obstacle') {
        item = document.createElement('img');
        item.className = 'obstacle';
        const obstacleNum = Math.floor(Math.random() * 3) + 1;
        item.src = `obstacle${obstacleNum}.png`;
        item.alt = `Obstacle ${obstacleNum}`;
    } else if (type === 'burger') {
        item = document.createElement('img');
        item.className = 'burger';
        item.src = 'burger.png';
        item.alt = 'Burger';
    } else if (type === 'quesadilla') {
        item = document.createElement('img');
        item.className = 'quesadilla';
        item.src = 'quesadilla.png';
        item.alt = 'Quesadilla';
    }
    item.style.left = '1200px';
    type === 'obstacle' ? obstaclesDiv.appendChild(item) : burgersDiv.appendChild(item);

    let itemPos = 1200;
    const moveItem = setInterval(() => {
        if (gameOver) {
            clearInterval(moveItem);
            item.remove();
            return;
        }

        itemPos -= 7.5 * speedMultiplier;
        item.style.left = itemPos + 'px';

        const carLeft = 150;
        const carRight = carLeft + 150;
        const carBottom = parseInt(car.style.bottom) || 75;
        const carTop = carBottom + 75;

        const itemLeft = itemPos;
        const itemRight = itemLeft + (type === 'obstacle' ? 60 : 75);
        const itemBottom = type === 'obstacle' ? 75 : 180;
        const itemTop = itemBottom + (type === 'obstacle' ? 60 : 75);

        const isColliding = (
            carLeft < itemRight &&
            carRight > itemLeft &&
            carTop > itemBottom &&
            carBottom < itemTop
        );

        if (isColliding) {
            if (type === 'obstacle') {
                if (carBottom <= 135) {
                    gameOver = true;
                    saveScore();
                    finalScoreDisplay.textContent = `Game Over! ${playerName}'s Score: ${score}`;
                    endScreen.style.display = 'block';
                    clearInterval(moveItem);
                    item.remove();
                }
            } else if (type === 'burger') {
                score += 10;
                item.remove();
                clearInterval(moveItem);
            } else if (type === 'quesadilla') {
                score += 15;
                item.remove();
                clearInterval(moveItem);
            }
        }

        if (itemPos < -75) {
            item.remove();
            clearInterval(moveItem);
        }
    }, 20);
}

let lastTime = Date.now();
function gameLoop() {
    if (!gameOver) {
        const currentTime = Date.now();
        if (currentTime - lastTime >= 1000) {
            score += 5;
            lastTime = currentTime;
        }
        scoreDisplay.textContent = 'Score: ' + score;

        if (currentTime - lastSpeedIncrease >= 25000) {
            speedMultiplier += 0.2;
            lastSpeedIncrease = currentTime;
            console.log('Speed increased to:', speedMultiplier);
        }

        roadPos -= 7.5 * speedMultiplier;
        treesPos -= 3 * speedMultiplier;
        if (roadPos <= -1200) roadPos = 0;
        if (treesPos <= -2400) treesPos = 0;
        road.style.backgroundPosition = roadPos + 'px bottom';
        trees.style.backgroundPosition = treesPos + 'px bottom';

        if (
            Math.random() < 0.003 &&
            currentTime - lastObstacleTime >= minObstacleGap
        ) {
            spawnItem('obstacle');
            lastObstacleTime = currentTime;
        }
        if (Math.random() < 0.01) {
            spawnItem('burger');
        }
        if (Math.random() < 0.003) {
            spawnItem('quesadilla');
        }
    }
    requestAnimationFrame(gameLoop);
}

updateScoreboard();