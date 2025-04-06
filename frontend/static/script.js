console.log("Kyra is running...");

// 🎙 Voice recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

recognition.onstart = () => {
  console.log("🎙️ Voice recognition started.");
  listenBtn.disabled = true;
  listenBtn.innerText = "🎧 Listening...";
};

recognition.onend = () => {
  console.log("🛑 Voice recognition ended.");
  listenBtn.disabled = false;
  listenBtn.innerText = "🎙️ Listen";
};

// 🔴 Error handling
recognition.onerror = (event) => {
  console.error("❌ Speech Recognition Error:", event.error);
  speak("Sorry, I couldn't hear that. Please try again.");
};

const kyraFace = document.getElementById("kyra-face");
const statusDiv = document.getElementById("status");
const listenBtn = document.getElementById("listen-btn");

let currentMood = "neutral";

const moodToImage = (mood, talking = false) => {
  return `/static/images/kyra_${mood}${talking ? '_talking' : ''}.png`;
};

// 🗣️ Voice synthesis
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';

  // 🟠 Lip sync: show talking face
  kyraFace.src = moodToImage(currentMood, true);

  utterance.onend = () => {
    kyraFace.src = moodToImage(currentMood, false);
  };

  window.speechSynthesis.speak(utterance);
};

// 🧠 Mood detection from response
function detectMood(responseText) {
  const text = responseText.toLowerCase();
  if (text.includes("glad") || text.includes("happy") || text.includes("great")) return "happy";
  if (text.includes("thinking") || text.includes("let me check")) return "thinking";
  if (text.includes("wow") || text.includes("really?")) return "surprised";
  return "neutral";
}

// 🎧 Button click to start listening
listenBtn.onclick = () => {
  console.log("👆 Listen button clicked.");
  recognition.start();
};

// 🔥 Main voice result handler
recognition.onresult = (event) => {
  console.log("🎤 onresult triggered:", event);
  const transcript = event.results[0][0].transcript;
  console.log("🗣️ Transcript:", transcript);
  statusDiv.innerText = `You: ${transcript}`;

  // Send to backend
  fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: transcript })
  })
  .then(res => res.json())
  .then(data => {
    const reply = data.reply;
    const audioUrl = data.audio;

    console.log("🤖 Kyra's Reply:", reply);
    currentMood = detectMood(reply);
    statusDiv.innerText = `Zara: ${reply}`;

    if (audioUrl) {
      // 🟢 Play custom audio (e.g. Malayalam)
      const audio = new Audio(audioUrl);

      // 🟠 Lip sync
      kyraFace.src = moodToImage(currentMood, true);

      audio.onended = () => {
        kyraFace.src = moodToImage(currentMood, false);
      };

      audio.onerror = () => {
        console.error("⚠️ Audio error, using fallback speech.");
        speak(reply);
      };

      audio.play().catch(err => {
        console.error("⚠️ Audio playback failed:", err);
        speak(reply);
      });
    } else {
      // 🔵 Default English speech
      speak(reply);
    }
  })
  .catch(err => {
    console.error("⚠️ Fetch error:", err);
    speak("Sorry, something went wrong.");
  });
};
