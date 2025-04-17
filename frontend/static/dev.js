console.log("Developer Mode Listening...");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

let listeningForWakeWord = true;
let inCommandMode = false;
const WAKE_WORD = "zara";

// Voice output
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  window.speechSynthesis.speak(utter);
}

// Looping wake word listener
function startWakeLoop() {
  recognition.start();
}

// Main Recognition Handler
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript.toLowerCase();
  console.log("👂 Heard:", transcript);

  if (listeningForWakeWord && transcript.includes(WAKE_WORD)) {
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
      inCommandMode = false;
      listeningForWakeWord = true;
    } else {
      speak("I didn't catch that. Say 'start learning' to teach me or 'exit' to leave developer mode.");
      setTimeout(() => recognition.start(), 3000);
    }
  }
};

// 🔄 Learning mode
function waitForLearning() {
  recognition.onresult = (event) => {
    const q = event.results[0][0].transcript;
    speak("Got the question. Now tell me the answer.");
    
    recognition.onresult = (event) => {
      const a = event.results[0][0].transcript;
      speak("Thank you for teaching me.");
      
      fetch("/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a })
      }).then(() => {
        listeningForWakeWord = true;
        inCommandMode = false;
        recognition.onresult = mainRecognitionHandler;
        setTimeout(() => recognition.start(), 2000);
      });
    };

    setTimeout(() => recognition.start(), 2000);
  };

  setTimeout(() => recognition.start(), 2000);
}

function mainRecognitionHandler(event) {
  recognition.onresult = recognition.onresult;
}

// Reset on end
recognition.onend = () => {
  if (listeningForWakeWord || inCommandMode) {
    recognition.start();
  }
};

// Start
startWakeLoop();
