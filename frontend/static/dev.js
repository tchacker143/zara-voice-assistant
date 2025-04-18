console.log("Developer Mode Listening...");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

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

// Handle learning
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
        recognition.onresult = handleRecognition;
        recognition.start();
      });
    };

    setTimeout(() => recognition.start(), 1500);
  };

  setTimeout(() => recognition.start(), 1000);
}

// Main recognition handler
function handleRecognition(event) {
  const transcript = event.results[0][0].transcript.toLowerCase().trim();
  console.log("👂 Heard:", transcript);

  // Only respond if it starts with "zara"
  if (!transcript.startsWith(WAKE_WORD)) {
    console.log("❌ Wake word not detected. Ignoring...");
    recognition.start();
    return;
  }

  // Extract the actual command after "zara"
  const command = transcript.replace(WAKE_WORD, '').replace(/^,?\s*/, ''); // remove "zara" and comma
  updateConversation("user", transcript);

  // Commands
  if (command.includes("start learning")) {
    speak("Okay. Please say the question.");
    waitForLearning();
  } else if (command.includes("feature panel") || command.includes("show feature panel")) {
    const featurePanel = document.getElementById("feature-panel");
    if (featurePanel) {
      featurePanel.style.display = "block";
      speak("Here is the feature panel.");
    } else {
      speak("Feature panel not found.");
    }
    recognition.start();
  } else if (command.includes("exit")) {
    speak("Deactivating developer mode. Goodbye!");
    const featurePanel = document.getElementById("feature-panel");
    if (featurePanel) featurePanel.style.display = "none";
    recognition.start();
  } else if (command.includes("show conversation")) {
    const sidePanel = document.getElementById("side-panel");
    if (sidePanel) {
      sidePanel.style.display = "block";
      speak("Conversation panel is now visible.");
    }
    recognition.start();
  } else {
    speak("Sorry, I didn't understand the command.");
    recognition.start();
  }
}

// Restart on end
recognition.onend = () => {
  recognition.start();
};

// Start recognition
recognition.onresult = handleRecognition;
recognition.start();

// Hotkey for memory toggle
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    const memoryBox = document.getElementById('memory-box');
    memoryBox.style.display = memoryBox.style.display === 'none' ? 'block' : 'none';
  }
});
