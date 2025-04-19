console.log("🛠️ Developer mode loaded");

const synth = window.speechSynthesis;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = true;

let isListeningForWakeWord = true;
let isLearning = false;
let pendingQuestion = null;

const wakeWord = "zara";

const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  synth.speak(utterance);
};

const greetDeveloper = () => {
  speak("Hello Developer. What would you like to do?");
  speak("Say 'teach' to teach me something new.");
  speak("Say 'memory' to view all stored questions.");
  speak("Say 'features' to know my upgrades.");
  speak("Or say 'deactivate developer mode' to exit.");
};

const handleCommand = (text) => {
  const msg = text.toLowerCase();

  if (msg.includes("deactivate developer mode")) {
    speak("Exiting developer mode. Goodbye!");
    setTimeout(() => {
      window.location.href = "/"; // go home
    }, 3000);
  }

  else if (msg.includes("teach")) {
    isLearning = true;
    speak("Please say the question you want me to learn.");
  }

  else if (msg.includes("memory")) {
    fetch("/memory")
      .then(res => res.json())
      .then(data => {
        const list = Object.entries(data);
        if (list.length === 0) {
          speak("I haven't learned anything yet.");
        } else {
          speak(`I remember ${list.length} things. Showing them now.`);
          const memoryDiv = document.getElementById("dev-memory");
          memoryDiv.innerHTML = "<h3>🧠 My Learned Memory:</h3><ul>" +
            list.map(([q, a]) => `<li><strong>Q:</strong> ${q} <br/><strong>A:</strong> ${a}</li>`).join("") +
            "</ul>";
        }
      });
  }

  else if (msg.includes("features")) {
    speak("Here are some of my recent features.");
    speak("Voice-based learning. Location detection. Wikipedia answering. Malayalam and English support.");
  }

  else if (isLearning) {
    if (!pendingQuestion) {
      pendingQuestion = msg;
      speak("Got it. Now please say the answer.");
    } else {
      const answer = msg;
      fetch("/learn", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: pendingQuestion, answer })
      })
      .then(res => res.json())
      .then(data => {
        speak(`Thank you. I’ve learned: ${pendingQuestion}`);
        console.log("🧠 Learned:", data);
      });
      pendingQuestion = null;
      isLearning = false;
    }
  }

  else {
    speak("Sorry, I didn't catch that. Please try again.");
  }
};

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
  console.log("🎧 Heard:", transcript);

  if (isListeningForWakeWord && transcript.includes(wakeWord)) {
    isListeningForWakeWord = false;
    speak("Yes Developer?");
    greetDeveloper();
  } else if (!isListeningForWakeWord) {
    handleCommand(transcript);
  }
};

recognition.onend = () => {
  recognition.start(); // keep it always listening
};

recognition.onerror = (e) => {
  console.error("❌ Speech recognition error:", e);
};

window.onload = () => {
  recognition.start();
  console.log("🟢 Listening for wake word: Zara");
};
