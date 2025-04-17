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

// Update conversation panel and memory box
function updateConversation(sender, message) {
  const conversationDiv = document.getElementById('conversation');
  const memoryBox = document.getElementById('memory-box');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add(sender === 'user' ? 'user-message' : 'zara-message');
  msgDiv.textContent = message;
  conversationDiv.appendChild(msgDiv);
  conversationDiv.scrollTop = conversationDiv.scrollHeight;

  conversationHistory.push(`${sender === 'user' ? 'You' : 'Zara'}: ${message}`);
  memoryBox.innerHTML = conversationHistory.join('<br>');
}

// Start listening for wake word
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

// Recognition result handler
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
    } else if (transcript.includes("feature panel")) {
      const featurePanel = document.getElementById("feature-panel");
      if (featurePanel) {
        featurePanel.style.display = "block";
        speak("Here is the feature panel.");
      } else {
        speak("Feature panel not found in the document.");
      }
    } else if (transcript.includes("exit")) {
      speak("Deactivating developer mode. Goodbye!");
      resetToWakeMode();
    } else {
      speak("I didn't catch that. Say 'start learning' to teach me, 'feature panel' to open options, or 'exit' to leave developer mode.");
      setTimeout(() => recognition.start(), 3000);
    }
  }
};

// Reset to wake mode
function resetToWakeMode() {
  listeningForWakeWord = true;
  inCommandMode = false;
  document.getElementById("status").innerText = '🎙 Listening for "Zara core"';

  // Hide feature panel if visible
  const featurePanel = document.getElementById("feature-panel");
  if (featurePanel) featurePanel.style.display = "none";

  recognition.onresult = defaultRecognitionHandler;
  setTimeout(() => recognition.start(), 2000);
}

// Backup handler
function defaultRecognitionHandler(event) {
  recognition.onresult = recognition.onresult;
}

// Keep listening
recognition.onend = () => {
  if (listeningForWakeWord || inCommandMode) {
    recognition.start();
  }
};

// Toggle memory box with 'M' key
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    const memoryBox = document.getElementById('memory-box');
    memoryBox.style.display = memoryBox.style.display === 'none' ? 'block' : 'none';
  }
});

// Start recognition
startWakeLoop();
