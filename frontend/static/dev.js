console.log("🟢 Developer Mode Listening...");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

const WAKE_WORD = "zara";
const conversationHistory = [];
let availableVoices = [];
let voiceReady = false;

// 🔁 Load voices with retry
function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  if (availableVoices.length === 0) {
    console.log("⏳ Waiting for voices...");
    setTimeout(loadVoices, 200);
  } else {
    voiceReady = true;
    console.log("✅ Voices ready:", availableVoices.map(v => v.name));
    greetDeveloper(); // Speak after voices loaded
  }
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// 🗣 Speak helper
function speak(text) {
  if (!voiceReady || availableVoices.length === 0) {
    console.warn("⚠️ Voices not ready. Skipping speech:", text);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  const voice = availableVoices.find(v =>
    v.lang.toLowerCase().includes("en") && v.name.toLowerCase().includes("google")
  ) || availableVoices[0];

  if (voice) utterance.voice = voice;
  console.log("🗣 Speaking:", text);
  speechSynthesis.speak(utterance);
  updateConversation('zara', text);
}

// 🖐️ Chrome unlock
window.addEventListener("click", () => {
  const unlock = new SpeechSynthesisUtterance("Voice unlocked");
  speechSynthesis.speak(unlock);
}, { once: true });

// 👋 Greet dev
function greetDeveloper() {
  speak("Welcome back, Developer. I'm listening.");
}

// 💬 Panel updater
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

// 🧠 Command handler
function handleRecognition(event) {
  const transcript = event.results[0][0].transcript.toLowerCase().trim();
  console.log("👂 Heard:", transcript);

  if (!transcript.startsWith(WAKE_WORD)) {
    console.log("⏭️ Ignored: no wake word");
    recognition.start();
    return;
  }

  const command = transcript.replace(WAKE_WORD, '').replace(/^,?\s*/, '');
  updateConversation("user", transcript);

  if (command.includes("start learning")) {
    speak("Okay. Please say the question.");
    waitForLearning();
  } else if (command.includes("feature panel")) {
    const panel = document.getElementById("feature-panel");
    if (panel) {
      panel.style.display = "block";
      speak("Here is the feature panel.");
    }
    recognition.start();
  } else if (command.includes("show conversation")) {
    const panel = document.getElementById("side-panel");
    if (panel) {
      panel.style.display = "flex";
      speak("Conversation panel opened.");
    }
    recognition.start();
  } else if (command.includes("exit")) {
    speak("Exiting developer mode. Goodbye.");
    const panel = document.getElementById("feature-panel");
    if (panel) panel.style.display = "none";
    recognition.start();
  } else {
    speak("Sorry, I didn't understand the command.");
    recognition.start();
  }
}

// 🔁 Resume listening
recognition.onend = () => recognition.start();
recognition.onresult = handleRecognition;
recognition.start();

// 🧠 Toggle memory with M
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    const memoryBox = document.getElementById('memory-box');
    memoryBox.style.display = memoryBox.style.display === 'none' ? 'block' : 'none';
  }
});
