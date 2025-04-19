console.log("Developer Mode Initialized");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

const WAKE_WORD = "zara";

let mode = "wake"; // can be "wake" or "command"

// Speak text
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  window.speechSynthesis.speak(utter);
  updateConversation("zara", text);
}

// Update conversation box
function updateConversation(sender, message) {
  const conversationDiv = document.getElementById('conversation');
  const memoryBox = document.getElementById('memory-box');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add(sender === 'user' ? 'user-message' : 'zara-message');
  msgDiv.textContent = message;
  conversationDiv.appendChild(msgDiv);
  conversationDiv.scrollTop = conversationDiv.scrollHeight;

  memoryBox.innerHTML += `${sender === 'user' ? 'You' : 'Zara'}: ${message}<br>`;
}

// Start recognition once
function listenOnce() {
  recognition.start();
}

// Wake Mode
function handleWakeResult(event) {
  const transcript = event.results[0][0].transcript.toLowerCase();
  console.log("👂 Heard (Wake):", transcript);

  if (transcript.includes(WAKE_WORD)) {
    speak("Yes, developer?");
    mode = "command";
    recognition.onresult = handleCommandResult;
    setTimeout(listenOnce, 1000); // slight delay before next listen
  } else {
    setTimeout(listenOnce, 1500); // retry after short pause
  }
}

// Command Mode
function handleCommandResult(event) {
  const transcript = event.results[0][0].transcript.toLowerCase();
  console.log("🎤 Command:", transcript);
  updateConversation("user", transcript);

  if (transcript.includes("start learning")) {
    speak("Okay. Please say the question.");
    // (You can plug in your learning mode here)
  } else if (transcript.includes("feature panel")) {
    const featurePanel = document.getElementById("feature-panel");
    if (featurePanel) {
      featurePanel.style.display = "block";
      speak("Here is the feature panel.");
    } else {
      speak("Feature panel not found.");
    }
  } else if (transcript.includes("exit")) {
    speak("Goodbye developer.");
  } else {
    speak("I didn't understand. Try again.");
  }

  // Reset back to wake mode
  mode = "wake";
  recognition.onresult = handleWakeResult;
  setTimeout(listenOnce, 2000);
}

// On end, restart based on mode
recognition.onend = () => {
  if (mode === "wake" || mode === "command") {
    listenOnce();
  }
};

// Error handler
recognition.onerror = (event) => {
  console.error("❌ Error:", event.error);
  speak("Mic error occurred.");
  setTimeout(listenOnce, 3000);
};

// Start Zara
recognition.onresult = handleWakeResult;
listenOnce();
