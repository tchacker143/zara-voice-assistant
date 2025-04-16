// Continuous listening for wake word "Hey Zara"
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = false;

recognition.onstart = () => {
  console.log("Listening for 'Hey Zara'...");
};

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();

  if (transcript.includes("hey zara")) {
    greetDeveloper();
  }
};

function startListening() {
  recognition.start();
}

function stopListening() {
  recognition.stop();
}

function greetDeveloper() {
  const greeting = "Hello Developer! Would you like to teach me something new, check previously taught questions, or hear my recent upgrades?";
  console.log(greeting);
  respondToCommand();
}

function respondToCommand() {
  recognition.stop(); // Stop listening while the command is processed
  
  const options = ['Start learning', 'Show previous questions', 'What’s new in you'];
  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.addEventListener('click', () => handleOptionSelection(option));
    document.body.appendChild(btn);
  });
}

function handleOptionSelection(command) {
  switch (command) {
    case 'Start learning':
      triggerLearningMode();
      break;
    case 'Show previous questions':
      showPreviousQuestions();
      break;
    case 'What’s new in you':
      showWhatsNew();
      break;
  }
}

function triggerLearningMode() {
  const question = prompt("What question would you like Zara to learn?");
  const answer = prompt("What is the answer?");
  saveToBackend(question, answer);
  alert("Thanks for teaching me! I’ve saved it.");
  startListening();  // Go back to listening after teaching
}

function saveToBackend(question, answer) {
  fetch('/save-memory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, answer }),
  })
  .then(response => response.json())
  .then(data => console.log("Memory saved:", data))
  .catch(error => console.error('Error saving memory:', error));
}

function showPreviousQuestions() {
  fetch('/get-memory')
    .then(response => response.json())
    .then(data => {
      const memoryList = data.memory.map(item => `<p><strong>Q:</strong> ${item.question} <br/><strong>A:</strong> ${item.answer}</p>`).join('');
      document.body.innerHTML = memoryList;
      startListening();  // Go back to listening after showing memory
    })
    .catch(error => console.error('Error fetching memory:', error));
}

function showWhatsNew() {
  const newFeatures = [
    "Wake Word Detection: Zara listens continuously for 'Hey Zara'.",
    "Greeting & Options Prompt: Zara greets you and asks what you'd like to do.",
    "Teach Me Mode: Zara can learn new questions and answers.",
    "Show Previous Questions: Zara can show all stored questions and answers.",
    "What’s New?: Zara shows recent features and skills."
  ];
  
  const newFeaturesList = newFeatures.map(feature => `<p>${feature}</p>`).join('');
  document.body.innerHTML = newFeaturesList;
  startListening();  // Go back to listening after showing new features
}

function deactivateDeveloperMode() {
  alert("Exiting Developer Mode...");
  stopListening(); // Stop listening completely when exiting
}

// Start listening when the page loads
window.onload = () => {
  startListening();
};
