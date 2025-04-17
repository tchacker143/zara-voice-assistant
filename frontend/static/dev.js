console.log("Developer Mode Listening...");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

let listeningForWakeWord = true;
let inCommandMode = false;
const WAKE_WORD = "zara";

// Store conversation history
const conversationHistory = [];

// Speak text
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  window.speechSynthesis.speak(utter);
  updateConversation('zara', text);
}

// Update both conversation panel and memory box
function updateConversation(sender, message) {
  const conversationDiv = document.getElementById('conversation');
  const memoryBox = document.getElementById('memory-box');

  // Update side panel
  const msgDiv = document.createElement('div');
  msgDiv.classList.add(sender === 'user' ? 'user-message' : 'zara-message');
  msgDiv.textContent = message;
  conversationDiv.appendChild(msgDiv);
  conversationDiv.scrollTop = conversationDiv.scrollHeight;

  // Update memory panel
  conversationHistory.push(`${sender === 'user' ? 'You' : 'Zara'}: ${message}`);
  memoryBox.innerHTML = conversationHistory.join('<br>');
}

// Listen loop
function startWakeLoop() {
  recognition.start();
  document.getElementById("status").innerText = '🎙 Listening for "Zara core"';
}

// Learning mode
function waitForLearning() {
  recognition.onresult = (event) => {
    const q = event.results[0][0].transcript;
    updateConversation("user", q);
    speak("Got the question. Now tell me the answer.");

    recognition.onresult = (event) => {
      const a = event.results[0][0].transcript;
      updateConversation("zara", a);
      speak("Thank you for teaching me.");

      fetch("/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a })
      }).then(() => {
        resetToWakeMode();
      });
    };

    setTimeout(() => recognition.start(), 2000);
  };

  setTimeout(() => recognition.start(), 1000);
}

// Recognition event handler
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript.toLowerCase();
  console.log("👂 Heard:", transcript);

  if (listeningForWakeWord && transcript.includes(WAKE_WORD)) {
    document.getElementById("status").innerText = "🟡 Command Mode Activated";
    listeningForWakeWord = false;
    inCommandMode = true;
    speak("Hello Developer. Would you like to teach me something, view what I know, or see upgrades?");
    setTimeout(() => recognition.start(), 3000);
  }
  else if (inCommandMode) {
    if (transcript.includes("start learning")) {
      speak("Okay. Please say the question.");
      waitForLearning();
    } else if (transcript.includes("exit")) {
      speak("Deactivating developer mode. Goodbye!");
      resetToWakeMode();
    } else {
      speak("I didn't catch that. Say 'start learning' to teach me or 'exit' to leave developer mode.");
      setTimeout(() => recognition.start(), 3000);
    }
  }
};

// Reset to wake mode
function resetToWakeMode() {
  listeningForWakeWord = true;
  inCommandMode = false;
  document.getElementById("status").innerText = '🎙 Listening for "Zara core"';
  recognition.onresult = defaultRecognitionHandler;
  setTimeout(() => recognition.start(), 2000);
}

// Backup handler
function defaultRecognitionHandler(event) {
  recognition.onresult = recognition.onresult;
}

// Ensure continuous recognition
recognition.onend = () => {
  if (listeningForWakeWord || inCommandMode) {
    recognition.start();
  }
};

// Optional hotkey to toggle memory box (press M)
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    const memoryBox = document.getElementById('memory-box');
    memoryBox.style.display = memoryBox.style.display === 'none' ? 'block' : 'none';
  }
});

// Start recognition
startWakeLoop();
