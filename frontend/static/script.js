console.log("Zara is running...");

// 🎙️ Voice Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

// DOM Elements
const kyraFace = document.getElementById("kyra-face");
const statusDiv = document.getElementById("status");
const listenBtn = document.getElementById("listen-btn");

let currentMood = "neutral";

// 🖼️ Expression Image Mapping
const moodToImage = (mood, talking = false) => {
  return `/static/images/kyra_${mood}${talking ? '_talking' : ''}.png`;
};

// 🗣️ Speech Synth with Lip Sync
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';

  kyraFace.src = moodToImage(currentMood, true);
  utterance.onend = () => {
    kyraFace.src = moodToImage(currentMood, false);
  };

  window.speechSynthesis.speak(utterance);
};

// 😊 Mood Detection
function detectMood(responseText) {
  const text = responseText.toLowerCase();
  if (text.includes("glad") || text.includes("happy") || text.includes("great")) return "happy";
  if (text.includes("thinking") || text.includes("let me check")) return "thinking";
  if (text.includes("wow") || text.includes("really?")) return "surprised";
  return "neutral";
}

// 📍 Browser Location with Reverse Geocoding
function detectLocation() {
  if ("geolocation" in navigator) {
    currentMood = "thinking";
    kyraFace.src = moodToImage(currentMood, true);
    speak("Let me check your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log(`📍 Latitude: ${lat}, Longitude: ${lon}`);

        fetch('/resolve-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon })
        })
        .then(res => res.json())
        .then(data => {
          const locationResponse = data.address || "I couldn't determine your location.";
          currentMood = "happy";
          statusDiv.innerText = `Zara: ${locationResponse}`;
          speak(locationResponse);
        })
        .catch(error => {
          console.error("🌍 Location fetch error:", error);
          currentMood = "neutral";
          speak("Sorry, I couldn't get your location.");
        });
      },
      (error) => {
        console.error("⚠️ Geolocation error:", error);
        currentMood = "neutral";
        speak("Location access was denied or unavailable.");
      }
    );
  } else {
    speak("Geolocation is not supported in this browser.");
  }
}

// 🎧 Start Listening Button
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

// 🧠 Main Transcript Handler
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  const lowerTranscript = transcript.toLowerCase();

  console.log("🗣️ Transcript:", transcript);
  statusDiv.innerText = `You: ${transcript}`;

  // 🌍 Location Trigger
  if (
    lowerTranscript.includes("where am i") ||
    lowerTranscript.includes("what's my location") ||
    lowerTranscript.includes("my location")
  ) {
    detectLocation();
    return;
  }

  // 🔁 Send to backend
  fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: transcript })
  })
  .then(res => res.json())
  .then(data => {
    const reply = data.reply;
    const audioUrl = data.audio;
    const redirectUrl = data.redirect;

    console.log("🤖 Zara's Reply:", reply);
    currentMood = detectMood(reply);
    statusDiv.innerText = `Zara: ${reply}`;

    if (redirectUrl) {
      speak(reply);
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
      return;
    }

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
