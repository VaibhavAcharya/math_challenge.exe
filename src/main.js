import './style.css';
import * as THREE from 'three';

// Game configuration
const config = {
  difficulty: {
    easy: {
      lives: 5,
      timePerQuestion: {
        addition: 30,
        subtraction: 30,
        multiplication: 40,
        division: 45
      },
      maxNumber: 10
    },
    medium: {
      lives: 3,
      timePerQuestion: {
        addition: 20,
        subtraction: 20,
        multiplication: 30,
        division: 35
      },
      maxNumber: 20
    },
    hard: {
      lives: 2,
      timePerQuestion: {
        addition: 15,
        subtraction: 15,
        multiplication: 20,
        division: 25
      },
      maxNumber: 50
    }
  }
};

// Game state
const gameState = {
  selectedDifficulty: 'medium',
  currentLives: 0,
  score: 0,
  highScore: localStorage.getItem('mathsGameHighScore') ? parseInt(localStorage.getItem('mathsGameHighScore')) : 0,
  timerInterval: null,
  remainingTime: 0,
  currentQuestion: null,
  currentAnswer: 0,
};

// DOM Elements
const elements = {
  homeScreen: document.getElementById('homeScreen'),
  gameScreen: document.getElementById('gameScreen'),
  gameOverScreen: document.getElementById('gameOverScreen'),
  
  difficultyButtons: document.querySelectorAll('.difficulty-btn'),
  startButton: document.getElementById('startButton'),
  
  livesDisplay: document.getElementById('livesDisplay'),
  scoreDisplay: document.getElementById('scoreDisplay'),
  timerDisplay: document.getElementById('timerDisplay'),
  
  questionDisplay: document.getElementById('questionDisplay'),
  answerInput: document.getElementById('answerInput'),
  submitButton: document.getElementById('submitButton'),
  
  highscoreDisplay: document.getElementById('highscoreDisplay'),
  finalScoreDisplay: document.getElementById('finalScoreDisplay'),
  finalHighScoreDisplay: document.getElementById('finalHighScoreDisplay'),
  
  restartButton: document.getElementById('restartButton'),
  homeButton: document.getElementById('homeButton'),
  
  matrixCanvas: document.getElementById('matrixCanvas'),
};

// Matrix Rain Effect
class MatrixRain {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    this.fontSize = 14;
    this.columns = Math.floor(this.canvas.width / this.fontSize);
    this.drops = [];
    this.symbols = "01";
    for (let i = 0; i < 50; i++) {
      this.symbols += String.fromCharCode(0x30A0 + Math.random() * 96);
    }
    
    // Normal color (green)
    this.normalColor = 'rgba(0, 255, 157, 0.8)';
    this.currentColor = this.normalColor;
    
    // Feedback state
    this.feedbackActive = false;
    this.feedbackType = null;
    this.feedbackDuration = 0;
    this.feedbackStartTime = 0;
    this.feedbackSymbol = null;
    this.feedbackOpacity = 1;
    
    this.initialize();
  }
  
  initialize() {
    for (let i = 0; i < this.columns; i++) {
      this.drops[i] = Math.floor(Math.random() * -100);
    }
  }
  
  // Show correct answer feedback
  showCorrectFeedback() {
    this.feedbackActive = true;
    this.feedbackType = 'correct';
    this.feedbackDuration = 1500;
    this.feedbackStartTime = Date.now();
    this.feedbackSymbol = '✓';
    this.feedbackOpacity = 1;
    
    // Create ripple effect from center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Draw circles expanding outward
    let radius = 0;
    const maxRadius = Math.max(this.canvas.width, this.canvas.height);
    const interval = setInterval(() => {
      radius += 15;
      
      // Draw green circle
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(0, 255, 157, ${1 - radius / maxRadius})`;
      this.ctx.lineWidth = 5;
      this.ctx.stroke();
      
      if (radius > maxRadius) {
        clearInterval(interval);
      }
    }, 20);
  }
  
  // Show incorrect answer feedback
  showIncorrectFeedback() {
    this.feedbackActive = true;
    this.feedbackType = 'incorrect';
    this.feedbackDuration = 1000;
    this.feedbackStartTime = Date.now();
    this.feedbackSymbol = '✗';
    this.feedbackOpacity = 1;
    
    // Flash the entire canvas red
    document.body.classList.add('error-flash');
    setTimeout(() => {
      document.body.classList.remove('error-flash');
    }, 500);
  }
  
  draw() {
    // Semi-transparent black background to show trail
    this.ctx.fillStyle = 'rgba(10, 14, 20, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Check if feedback is active
    if (this.feedbackActive) {
      const elapsed = Date.now() - this.feedbackStartTime;
      
      if (elapsed > this.feedbackDuration) {
        // Reset feedback
        this.feedbackActive = false;
        this.currentColor = this.normalColor;
      } else {
        // Set color based on feedback type
        if (this.feedbackType === 'correct') {
          // Pulsing green for correct
          const pulseIntensity = 0.5 + 0.5 * Math.sin(elapsed / 100);
          this.currentColor = `rgba(0, ${Math.floor(200 + 55 * pulseIntensity)}, 157, 0.8)`;
          
          // Draw large checkmark in center if in first half of animation
          if (elapsed < this.feedbackDuration / 2) {
            this.feedbackOpacity = 1 - (elapsed / (this.feedbackDuration / 2));
            this.ctx.font = 'bold 150px "Fira Code", monospace';
            this.ctx.fillStyle = `rgba(0, 255, 157, ${this.feedbackOpacity})`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.feedbackSymbol, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'start';
            this.ctx.textBaseline = 'alphabetic';
          }
        } else if (this.feedbackType === 'incorrect') {
          // Red color for incorrect
          this.currentColor = 'rgba(255, 23, 68, 0.8)';
          
          // Draw large X in center if in first half of animation
          if (elapsed < this.feedbackDuration / 2) {
            this.feedbackOpacity = 1 - (elapsed / (this.feedbackDuration / 2));
            this.ctx.font = 'bold 150px "Fira Code", monospace';
            this.ctx.fillStyle = `rgba(255, 23, 68, ${this.feedbackOpacity})`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.feedbackSymbol, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'start';
            this.ctx.textBaseline = 'alphabetic';
          }
        }
      }
    }
    
    // Set text color (normal or feedback color)
    this.ctx.fillStyle = this.currentColor;
    this.ctx.font = `${this.fontSize}px monospace`;
    
    // Loop over drops
    for (let i = 0; i < this.drops.length; i++) {
      // Get random symbol
      const text = this.symbols.charAt(Math.floor(Math.random() * this.symbols.length));
      
      // Draw symbol
      this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
      
      // Reset drops when they reach bottom or randomly to create staggered effect
      if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      
      // Move drop (speed up during feedback)
      const speedMultiplier = this.feedbackActive ? 1.5 : 1;
      this.drops[i] += speedMultiplier;
    }
  }
  
  animate() {
    this.draw();
    requestAnimationFrame(this.animate.bind(this));
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.columns = Math.floor(this.canvas.width / this.fontSize);
    this.initialize();
  }
}

// Initialize Matrix Rain
const matrixRain = new MatrixRain(elements.matrixCanvas);
matrixRain.animate();

// Add typing animation to elements
function addTypingAnimation(element, delay = 50) {
  if (!element) return;
  
  const text = element.innerText;
  element.innerText = '';
  element.classList.add('typing');
  
  let index = 0;
  const type = () => {
    if (index < text.length) {
      element.innerText += text.charAt(index);
      index++;
      setTimeout(type, delay);
    } else {
      element.classList.remove('typing');
    }
  };
  
  setTimeout(type, 100);
}

// Initialize UI animations
function initUIAnimations() {
  document.querySelectorAll('.command').forEach((el, i) => {
    addTypingAnimation(el, 30 + i * 10);
  });
  
  document.querySelectorAll('.system-output p').forEach((el, i) => {
    setTimeout(() => {
      addTypingAnimation(el, 20);
    }, 500 + i * 200);
  });
}

// Game functionality
function initGame() {
  // Update highscore display
  const highScoreElement = elements.highscoreDisplay.querySelector('.highlight');
  if (highScoreElement) {
    highScoreElement.textContent = gameState.highScore;
  }
  
  // Add event listeners
  elements.difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      elements.difficultyButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update selected difficulty
      gameState.selectedDifficulty = button.dataset.difficulty;
    });
  });
  
  elements.startButton.addEventListener('click', startGame);
  elements.submitButton.addEventListener('click', submitAnswer);
  elements.answerInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      submitAnswer();
    }
  });
  
  elements.restartButton.addEventListener('click', startGame);
  elements.homeButton.addEventListener('click', goToHome);
  
  // Set default difficulty
  document.querySelector(`[data-difficulty="${gameState.selectedDifficulty}"]`).classList.add('active');
  
  // Initialize UI animations
  initUIAnimations();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    matrixRain.resize();
  });
  
  // Add global keyboard handlers immediately
  document.addEventListener('keydown', handleKeyboardInput);
}

function startGame() {
  // Reset game state
  gameState.currentLives = config.difficulty[gameState.selectedDifficulty].lives;
  gameState.score = 0;
  
  // Update UI
  const livesValue = elements.livesDisplay.querySelector('.lives-value');
  const scoreValue = elements.scoreDisplay.querySelector('.score-value');
  
  if (livesValue) livesValue.textContent = gameState.currentLives;
  if (scoreValue) scoreValue.textContent = gameState.score;
  
  // Show game screen, hide other screens
  elements.homeScreen.classList.add('hidden');
  elements.gameOverScreen.classList.add('hidden');
  elements.gameScreen.classList.remove('hidden');
  
  // Add startup animations
  document.querySelectorAll('#gameScreen .system-output p').forEach((el, i) => {
    setTimeout(() => {
      addTypingAnimation(el, 20);
    }, 100 + i * 200);
  });
  
  // Generate first question
  setTimeout(() => {
    generateQuestion();
    
    // Focus answer input
    elements.answerInput.focus();
  }, 1000);
  
  // No need to add keyboard handlers again since they're already set up in initGame
}

// Global keyboard input handler
function handleKeyboardInput(event) {
  // Only process if on game screen and not in an input field already
  if (!elements.gameScreen.classList.contains('hidden') && 
      document.activeElement !== elements.answerInput) {
    
    // If any key is pressed and we're not focused on input, focus on it
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      elements.answerInput.focus();
    }
    
    // Submit on Enter key
    if (event.key === 'Enter') {
      submitAnswer();
    }
  }
  
  // For game over screen, allow shortcuts
  if (!elements.gameOverScreen.classList.contains('hidden')) {
    if (event.key === 'r' || event.key === 'R') {
      // Restart game
      startGame();
    } else if (event.key === 'h' || event.key === 'H') {
      // Go home
      goToHome();
    }
  }
  
  // For home screen, allow shortcuts
  if (!elements.homeScreen.classList.contains('hidden')) {
    if (event.key === '1') {
      // Select Easy
      document.querySelector('[data-difficulty="easy"]').click();
    } else if (event.key === '2') {
      // Select Medium
      document.querySelector('[data-difficulty="medium"]').click();
    } else if (event.key === '3') {
      // Select Hard
      document.querySelector('[data-difficulty="hard"]').click();
    } else if (event.key === 'Enter') {
      // Start game
      elements.startButton.click();
    }
  }
}

function generateQuestion() {
  const operators = ['+', '-', '×', '÷'];
  const operatorIndex = Math.floor(Math.random() * operators.length);
  const operator = operators[operatorIndex];
  
  const maxNumber = config.difficulty[gameState.selectedDifficulty].maxNumber;
  let num1, num2, result;
  
  switch (operator) {
    case '+': // Addition
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * maxNumber) + 1;
      result = num1 + num2;
      gameState.remainingTime = config.difficulty[gameState.selectedDifficulty].timePerQuestion.addition;
      break;
      
    case '-': // Subtraction
      num2 = Math.floor(Math.random() * maxNumber) + 1;
      // Ensure result is positive for easier gameplay
      num1 = num2 + Math.floor(Math.random() * maxNumber) + 1;
      result = num1 - num2;
      gameState.remainingTime = config.difficulty[gameState.selectedDifficulty].timePerQuestion.subtraction;
      break;
      
    case '×': // Multiplication
      num1 = Math.floor(Math.random() * (maxNumber / 2)) + 1;
      num2 = Math.floor(Math.random() * (maxNumber / 2)) + 1;
      result = num1 * num2;
      gameState.remainingTime = config.difficulty[gameState.selectedDifficulty].timePerQuestion.multiplication;
      break;
      
    case '÷': // Division
      num2 = Math.floor(Math.random() * (maxNumber / 4)) + 1;
      // Generate multiple of num2 for clean division
      result = Math.floor(Math.random() * (maxNumber / 4)) + 1;
      num1 = num2 * result;
      gameState.remainingTime = config.difficulty[gameState.selectedDifficulty].timePerQuestion.division;
      break;
  }
  
  // Store question data
  gameState.currentQuestion = { num1, num2, operator };
  gameState.currentAnswer = result;
  
  // Update question display
  elements.questionDisplay.textContent = `${num1} ${operator} ${num2} = ?`;
  
  // Clear previous answer
  elements.answerInput.value = '';
  
  // Start timer
  startTimer();
}

function startTimer() {
  // Clear any existing timers
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
  }
  
  // Update timer display
  updateTimerDisplay();
  
  // Set new timer
  gameState.timerInterval = setInterval(() => {
    // Decrement time
    gameState.remainingTime--;
    
    // Update display
    updateTimerDisplay();
    
    // Check if time ran out
    if (gameState.remainingTime <= 0) {
      clearInterval(gameState.timerInterval);
      handleWrongAnswer();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerValue = elements.timerDisplay.querySelector('.timer-value');
  if (timerValue) {
    timerValue.textContent = `${gameState.remainingTime}s`;
  }
  
  // Add warning class if time is running low
  if (gameState.remainingTime <= 5) {
    elements.timerDisplay.classList.add('warning');
  } else {
    elements.timerDisplay.classList.remove('warning');
  }
}

function submitAnswer() {
  const userAnswer = parseInt(elements.answerInput.value);
  
  // Check if answer is valid
  if (isNaN(userAnswer)) {
    // Alert user to enter a valid number
    elements.answerInput.classList.add('invalid');
    matrixRain.showIncorrectFeedback();
    
    // Play error sound (beep)
    const errorBeep = new Audio("data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAGUACFhYWFhYWFhYWFhYWFhYWFhYWFvb29vb29vb29vb29vb29vb29vb3p6enp6enp6enp6enp6enp6enp6f////////////////////////////////8AAAA8TEFNRTMuOTlyAc0AAAAAAAAAABSAJAJAQgAAgAAAA+hh7/ISAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAANIAAAAQAAAAAAAAAAABPQ88DEIQRBAECAIAQA//NHz4J///+g5/P0oIKGV8Xg8DdC0D4gEUBngxUFw//8z61S79/u9zpMJh+gAAAAAMOAZCIgij//uSxBKD2OoBtmGEjcMmQDccsI24ICCAACDui8HAIJBIOI5MQgg5oFB5BDIeiLweP7oDxeLxeHyChBwQQc+hBBBz9PowfJR/Jw+Cj+gAYPgAOgYBkIxFEUTf///2YP41vt4GAZEYoigMCCCCQcRyYhBBzQLHceiLweQUIOCI/ugPF4vD5BQg4Pp9AoNEh8PovB8lH8HD4KP4AAAAADAL7rAwDIRiKIom///+zB/Gt9vAwDIjFEUBgQQQSDiOTEIIOaBY7j0ReDyCBBwRH90B4vF4fIKEHB9PoFBokPh9F4Pko/g4fBR/AAAAE4DAMhGIoiib///7MH8a328DAMiMURQGBBBBIOI5MQgg5oFjuPRF4PIIEHBEf3QHi8Xh8goQcH0+gUGiQ+H0Xg+Sj+Dh8FH8AAA=");
    errorBeep.volume = 0.2;
    errorBeep.play();
    
    setTimeout(() => {
      elements.answerInput.classList.remove('invalid');
      // Clear the input and re-focus
      elements.answerInput.value = '';
      elements.answerInput.focus();
    }, 600);
    return;
  }
  
  // Check answer
  if (userAnswer === gameState.currentAnswer) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer(userAnswer);
  }
}

function handleCorrectAnswer() {
  // Stop timer
  clearInterval(gameState.timerInterval);
  
  // Increase score
  gameState.score++;
  
  // Update score display
  const scoreValue = elements.scoreDisplay.querySelector('.score-value');
  if (scoreValue) {
    scoreValue.textContent = gameState.score;
    // Add a quick pulse animation
    scoreValue.style.animation = 'none';
    setTimeout(() => {
      scoreValue.style.animation = 'pulse 1s';
    }, 10);
  }
  
  // Show feedback animation in terminal
  elements.questionDisplay.classList.add('correct');
  
  // Show feedback in matrix
  matrixRain.showCorrectFeedback();
  
  // Play success sound
  const successSound = new Audio("data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAKAAAJwQB1dXV1dXV1dXV1dXV1dXV1dXV1dXWUlJSUlJSUlJSUlJSUlJSUlJSUlJSysbGxsbGxsbGxsbGxsbGxsbGxsbHMzMzMzMzMzMzMzMzMzMzMzMzMzMzm5ubm5ubm5ubm5ubm5ubm5ubm5ub////////////////////////////////8AAAA5TEFNRTMuOTlyBK8AAAAAAAAAAAylAiQiAABgAAAJwdE7XugAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADw1wBImAAACAAAP8AAAAETEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==");
  successSound.volume = 0.3;
  successSound.play();
  
  // Flash the code-block green
  const codeBlock = document.querySelector('.code-block');
  if (codeBlock) {
    codeBlock.style.boxShadow = '0 0 15px rgba(0, 255, 157, 0.8)';
    setTimeout(() => {
      codeBlock.style.boxShadow = '';
    }, 1000);
  }
  
  setTimeout(() => {
    elements.questionDisplay.classList.remove('correct');
    // Generate new question
    generateQuestion();
    
    // Clear the input and refocus
    elements.answerInput.value = '';
    elements.answerInput.focus();
  }, 1500);
}

function handleWrongAnswer(userAnswer) {
  // Stop timer
  clearInterval(gameState.timerInterval);
  
  // Decrease lives
  gameState.currentLives--;
  
  // Update UI
  const livesValue = elements.livesDisplay.querySelector('.lives-value');
  if (livesValue) {
    livesValue.textContent = gameState.currentLives;
    // Add a quick pulse animation
    livesValue.style.animation = 'none';
    setTimeout(() => {
      livesValue.style.animation = 'incorrectAnswer 1s';
    }, 10);
  }
  
  // Show feedback animation in terminal
  elements.questionDisplay.classList.add('incorrect');
  
  // Show the correct answer temporarily
  const question = elements.questionDisplay.textContent;
  const [problem, _] = question.split('=');
  elements.questionDisplay.innerHTML = `${problem}= <span style="color: var(--accent);">${userAnswer}</span> ❌ <span style="color: var(--primary);">${gameState.currentAnswer}</span> ✓`;
  
  // Show feedback in matrix
  matrixRain.showIncorrectFeedback();
  
  // Play error sound
  const errorSound = new Audio("data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAOAAAHAgCAgICAgICAgICAgICAgICAgKampqampqampqampqampqampqb///////////////////////////9MQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==");
  errorSound.volume = 0.3;
  errorSound.play();
  
  // Flash the code-block red
  const codeBlock = document.querySelector('.code-block');
  if (codeBlock) {
    codeBlock.style.boxShadow = '0 0 15px rgba(255, 23, 68, 0.8)';
    setTimeout(() => {
      codeBlock.style.boxShadow = '';
    }, 1000);
  }
  
  setTimeout(() => {
    elements.questionDisplay.classList.remove('incorrect');
    
    // Check if game over
    if (gameState.currentLives <= 0) {
      gameOver();
    } else {
      // Generate new question
      generateQuestion();
      
      // Clear the input and refocus
      elements.answerInput.value = '';
      elements.answerInput.focus();
    }
  }, 2000);
}

function gameOver() {
  // Stop timer
  clearInterval(gameState.timerInterval);
  
  // Update high score if needed
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('mathsGameHighScore', gameState.highScore);
  }
  
  // Update game over screen
  const finalScoreElement = elements.finalScoreDisplay.querySelector('.highlight');
  const finalHighScoreElement = elements.finalHighScoreDisplay.querySelector('.highlight');
  
  if (finalScoreElement) finalScoreElement.textContent = gameState.score;
  if (finalHighScoreElement) finalHighScoreElement.textContent = gameState.highScore;
  
  // Hide game screen, show game over screen
  elements.gameScreen.classList.add('hidden');
  elements.gameOverScreen.classList.remove('hidden');
  
  // Add typing animation to log entries
  document.querySelectorAll('.system-log .log-entry').forEach((el, i) => {
    setTimeout(() => {
      addTypingAnimation(el, 30);
    }, 300 + i * 200);
  });
}

function goToHome() {
  // Hide game over screen, show home screen
  elements.gameOverScreen.classList.add('hidden');
  elements.homeScreen.classList.remove('hidden');
  
  // Update high score display
  const highScoreElement = elements.highscoreDisplay.querySelector('.highlight');
  if (highScoreElement) {
    highScoreElement.textContent = gameState.highScore;
  }
  
  // Reset animations
  initUIAnimations();
}

// Initialize game
initGame();