console.log("Kyra is running...");

// 🎙 Voice recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

const kyraFace = document.getElementById("kyra-face");
const statusDiv = document.getElementById("status");
const listenBtn = document.getElementById("listen-btn");

let currentMood = "neutral";

// 🎭 Mood ↔️ Image Mapping
const moodToImage = (mood, talking = false) => {
  return `/static/images/kyra_${mood}${talking ? '_talking' : ''}.png`;
};

// 🔊 Speak Function with Lip Sync
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';

  kyraFace.src = moodToImage(currentMood, true);
  utterance.onend = () => {
    kyraFace.src = moodToImage(currentMood, false);
  };

  window.speechSynthesis.speak(utterance);
};

// 😐→😊 Mood Detection
function detectMood(responseText) {
  const text = responseText.toLowerCase();
  if (text.includes("glad") || text.includes("happy") || text.includes("great")) return "happy";
  if (text.includes("thinking") || text.includes("let me check")) return "thinking";
  if (text.includes("wow") || text.includes("really?")) return "surprised";
  return "neutral";
}

// 🎧 Start Listening
listenBtn.onclick = () => {
  console.log("👆 Listen button clicked.");
  recognition.start();
};

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

recognition.onerror = (event) => {
  console.error("❌ Speech Recognition Error:", event.error);
  speak("Sorry, I couldn't hear that. Please try again.");
};

// 📍 Detect Location Function
function detectLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Latitude: ${latitude}, Longitude: ${longitude}`);

        try {
          const res = await fetch('/resolve-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lon: longitude })
          });

          const data = await res.json();
          const locationResponse = data.address || "I couldn't determine your location.";
          currentMood = "thinking";
          statusDiv.innerText = `Zara: ${locationResponse}`;
          speak(locationResponse);
        } catch (err) {
          console.error("🌍 Location fetch error:", err);
          speak("Sorry, I couldn't get your location.");
        }
      },
      (error) => {
        console.error("⚠️ Geolocation error:", error);
        speak("Location access was denied or unavailable.");
      }
    );
  } else {
    speak("Geolocation is not supported in this browser.");
  }
}

// 🧠 Voice command handler
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log("🗣️ Transcript:", transcript);
  statusDiv.innerText = `You: ${transcript}`;

  // 🌍 Check for location trigger
  if (transcript.toLowerCase().includes("where am i") || transcript.toLowerCase().includes("what's my location") || transcript.toLowerCase().includes("my location")) {
    detectLocation();
    return;
  }

  // 🤖 Normal command handling
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
      const audio = new Audio(audioUrl);
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
      speak(reply);
    }
  })
  .catch(err => {
    console.error("⚠️ Fetch error:", err);
    speak("Sorry, something went wrong.");
  });
};
