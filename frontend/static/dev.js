console.log("Developer Mode Listening...");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

const WAKE_WORD = "zara";
const conversationHistory = [];

// 🔁 Load voices when available
window.speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
  console.log("✅ Voices loaded:", availableVoices.map(v => v.name));
};

// 🗣 Speak with selected voice
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';

  const selectedVoice = availableVoices.find(voice =>
    voice.lang.toLowerCase().includes("en") &&
    voice.name.toLowerCase().includes("google")
  ) || availableVoices[0];

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynthesis.speak(utterance);
  updateConversation('zara', text);
}
// 🗣 Update text panel
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

// 🎓 Learning mode
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

// 🧠 Main recognition logic
function handleRecognition(event) {
  const transcript = event.results[0][0].transcript.toLowerCase().trim();
  console.log("👂 Heard:", transcript);

  if (!transcript.startsWith(WAKE_WORD)) {
    console.log("❌ Wake word not detected. Ignoring...");
    recognition.start();
    return;
  }

  const command = transcript.replace(WAKE_WORD, '').replace(/^,?\s*/, '');
  updateConversation("user", transcript);

  if (command.includes("start learning")) {
    speak("Okay. Please say the question.");
    waitForLearning();
  } else if (command.includes("feature panel") || command.includes("show feature panel")) {
    const panel = document.getElementById("feature-panel");
    if (panel) {
      panel.style.display = "block";
      speak("Here is the feature panel.");
    } else {
      speak("Feature panel not found.");
    }
    recognition.start();
  } else if (command.includes("show conversation")) {
    const sidePanel = document.getElementById("side-panel");
    if (sidePanel) {
      sidePanel.style.display = "flex";
      speak("Conversation panel is now visible.");
    }
    recognition.start();
  } else if (command.includes("exit")) {
    speak("Deactivating developer mode. Goodbye.");
    const featurePanel = document.getElementById("feature-panel");
    if (featurePanel) featurePanel.style.display = "none";
    recognition.start();
  } else {
    speak("Sorry, I didn't understand the command.");
    recognition.start();
  }
}

// 🔄 Restart listener when done
recognition.onend = () => {
  recognition.start();
};

// 🏁 Start recognition
recognition.onresult = handleRecognition;
recognition.start();

// 🧠 Toggle memory box with M key
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    const memoryBox = document.getElementById('memory-box');
    memoryBox.style.display = memoryBox.style.display === 'none' ? 'block' : 'none';
  }
});

// 🛑 Chrome audio unlock workaround
window.addEventListener("click", () => {
  const unlock = new SpeechSynthesisUtterance("Voice unlocked");
  window.speechSynthesis.speak(unlock);
}, { once: true });
