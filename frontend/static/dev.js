const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true; // Set continuous to true
recognition.interimResults = true; // Allow for interim results

let developerModeActive = false;

// Function to greet the developer
function greetDeveloper() {
    console.log("Hello Developer! What would you like to do?");
    // You can add any audio greeting here if needed, e.g., using text-to-speech.
    speak("Hello Developer! What would you like to do?");
}

// Function for text-to-speech
function speak(text) {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

// Event listener for when recognition starts
recognition.onstart = () => {
    console.log("Microphone is on, waiting for commands...");
};

// Event listener for when recognition results are returned
recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    console.log("You said: " + transcript);

    // Check if the wake word was detected
    if (transcript.toLowerCase().includes('hey zara') && !developerModeActive) {
        console.log("Wake word detected! Entering Developer Mode...");
        developerModeActive = true;
        greetDeveloper(); // Greet the developer when entering Developer Mode
        recognition.stop(); // Stop recognition until the next trigger
        setTimeout(() => {
            recognition.start(); // Restart recognition after a short delay
        }, 2000);
    }

    // Handle further commands here (e.g., "teach me", "show previous questions", etc.)
    if (developerModeActive) {
        if (transcript.toLowerCase().includes('teach me')) {
            console.log("Entering learning mode...");
            speak("What would you like to teach me?");
        } else if (transcript.toLowerCase().includes('show previous questions')) {
            console.log("Displaying previous questions...");
            speak("Here are the previous questions I have learned.");
        } else if (transcript.toLowerCase().includes('what\'s new')) {
            console.log("Listing recent updates...");
            speak("Here are the new features and skills I have.");
        } else if (transcript.toLowerCase().includes('deactivate developer mode')) {
            console.log("Deactivating Developer Mode...");
            developerModeActive = false;
            speak("Developer Mode deactivated. Returning to home.");
            recognition.stop(); // Stop recognition and return to normal mode
        }
    }
};

// Event listener for when recognition ends
recognition.onend = () => {
    console.log("Recognition ended, restarting...");
    if (developerModeActive) {
        recognition.start(); // Restart recognition if in Developer Mode
    }
};

// Event listener for errors
recognition.onerror = (event) => {
    console.error("Error occurred in recognition: " + event.error);
};

// Start listening
recognition.start();
