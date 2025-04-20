// dev.js
console.log("🟢 Zara Developer Mode Loaded");

let availableVoices = [];
let voiceReady = false;
const WAKE_WORD = "zara";
const conversationHistory = [];

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-IN';
recognition.interimResults = false;
recognition.continuous = false;

// Load voices
function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  if (availableVoices.length === 0) return setTimeout(loadVoices, 100);
  voiceReady = true;
  speak("Welcome back, Developer. I'm listening.");
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  if (!voiceReady) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  const voice = availableVoices.find(v => v.name.toLowerCase().includes("google")) || availableVoices[0];
  if (voice) utter.voice = voice;
  speechSynthesis.speak(utter);
  updateConversation("zara", text);
}

function updateConversation(sender, message) {
  const box = document.getElementById("conversation");
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-message" : "zara-message";
  div.textContent = message;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;

  const memory = document.getElementById("memory-box");
  conversationHistory.push(`${sender === 'user' ? 'You' : 'Zara'}: ${message}`);
  memory.innerHTML = conversationHistory.join('<br>');
}

function handleCommand(transcript) {
  const command = transcript.replace(WAKE_WORD, '').replace(/^,?\s*/, '').trim();
  updateConversation("user", transcript);

  if (command.includes("feature panel")) {
    document.getElementById("feature-panel").style.display = "block";
    speak("Here is the feature panel.");
  } else if (command.includes("show conversation")) {
    document.getElementById("side-panel").style.display = "flex";
    speak("Conversation panel is now visible.");
  } else if (command.includes("exit")) {
    speak("Exiting developer mode. Goodbye.");
    document.getElementById("feature-panel").style.display = "none";
  } else {
    speak("Sorry, I didn't understand that.");
  }
  recognition.start();
}

recognition.onresult = (event) => {
  const text = event.results[0][0].transcript.toLowerCase();
  if (!text.startsWith(WAKE_WORD)) return recognition.start();
  handleCommand(text);
};

recognition.onend = () => recognition.start();
recognition.start();

// Chrome speech unlock
window.addEventListener("click", () => {
  const unlock = new SpeechSynthesisUtterance("Voice unlocked");
  speechSynthesis.speak(unlock);
}, { once: true });

// Rotating sphere animation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sphereGeometry = new THREE.SphereGeometry(3, 64, 64);
const sphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  wireframe: true,
  transparent: true,
  opacity: 0.2
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 1000;
const posArray = [];
for (let i = 0; i < particleCount; i++) {
  const radius = 3;
  const phi = Math.random() * 2 * Math.PI;
  const theta = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(theta);
  posArray.push(x, y, z);
}
particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));

const particleMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.05, transparent: true, opacity: 0.9 });
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

camera.position.z = 7;
function animate() {
  requestAnimationFrame(animate);
  sphere.rotation.x += 0.003;
  sphere.rotation.y += 0.003;
  particles.rotation.x += 0.002;
  particles.rotation.y += 0.002;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
