from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from langdetect import detect
from gtts import gTTS
import os
import random
from datetime import datetime
import pytz
import requests
import wikipedia

# Flask Setup
app = Flask(__name__, template_folder="../frontend", static_folder="../frontend/static")
CORS(app)
app.secret_key = 'your-super-secret-key'

# Memory (Zara learns answers here)
user_memory = {}

# Malayalam Responses
def malayalam_response(user_message):
    if "പേര്" in user_message:
        return "എന്റെ പേര് കൈറയാണ്"
    elif "സമയം" in user_message:
        return f"ഇപ്പോൾ സമയം {get_indian_time()} ആണ്"
    elif "നന്ദി" in user_message:
        return "എനിക്ക് സന്തോഷമാണ് ബോസ്!"
    elif "വിട" in user_message or "ബൈ" in user_message:
        return "കൈറ പോയി, വീണ്ടും വിളിക്കണേ ബോസ്!"
    else:
        return "അതെന്താണെന്ന് എനിക്ക് മനസ്സിലായില്ല ബോസ്!"

# Malayalam Voice Generator
def generate_malayalam_audio(text):
    tts = gTTS(text=text, lang='ml')
    filename = f"Zara_ml_reply_{random.randint(1000,9999)}.mp3"
    filepath = os.path.join("frontend/static", filename)
    tts.save(filepath)
    return filename

# Indian Time (IST)
def get_indian_time():
    india = pytz.timezone('Asia/Kolkata')
    india_time = datetime.now(india)
    return india_time.strftime('%I:%M %p')

# IP-based Location Fallback
def get_location():
    import geocoder
    g = geocoder.ip('me')
    if g.ok:
        return f"Your current location is {g.city}, {g.state}, {g.country}"
    return "Sorry, I couldn't detect your location."

# Zara's Memory File (for persistence later)
MEMORY_FILE = "frontend/static/zara_memory.json"

# 🧠 Main AI Logic
@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get('message', '').strip().lower()

    # Language detection
    try:
        lang = detect(user_message)
    except:
        lang = 'en'

    # 🔐 Developer Mode Activation
    if "activate developer mode" in user_message:
        session['awaiting_dev_password'] = True
        return jsonify({'reply': "Please say the developer password.", 'audio': None})

    if session.get('awaiting_dev_password'):
        if user_message == "2005":
            session['dev_mode'] = True
            session.pop('awaiting_dev_password', None)
            return jsonify({'reply': "Developer mode activated. Redirecting...", 'redirect': '/developer', 'audio': None})
        else:
            session.pop('awaiting_dev_password', None)
            return jsonify({'reply': "Incorrect password. Developer mode not activated.", 'audio': None})

    # 🗣️ Malayalam
    if lang == 'ml':
        reply = malayalam_response(user_message)
        audio_file = generate_malayalam_audio(reply)
        return jsonify({'reply': reply, 'audio': f'static/{audio_file}'})

    # 💾 Memory-based Reply
    if user_message in user_memory:
        return jsonify({'reply': f"You told me: {user_memory[user_message]}", 'audio': None})

    # 🤖 Personal Predefined Answers
    personal = {
        "your name": "I'm Zara, your assistant!",
        "who created you": "I was created by my developer, that's you!",
        "what can you do": "I can answer questions, remember things, and help you like a real assistant.",
        "how are you": "I'm doing great, thank you for asking!",
        "hello": "Hello! How can I help you today?",
        "time": f"The current time is {get_indian_time()}.",
        "location": get_location(),
        "where am i": get_location()
    }

    if user_message in personal:
        return jsonify({'reply': personal[user_message], 'audio': None})

    # 🌐 Try Wikipedia
    try:
        summary = wikipedia.summary(user_message, sentences=2)
        return jsonify({'reply': summary, 'audio': None})
    except wikipedia.exceptions.DisambiguationError as e:
        return jsonify({'reply': f"I found many results: {e.options[:3]}. Please be more specific.", 'audio': None})
    except wikipedia.exceptions.PageError:
        return jsonify({'reply': "I couldn't find anything for that. Can you tell me the answer?", 'audio': None})
    except Exception:
        return jsonify({'reply': "Something went wrong when trying to get the information.", 'audio': None})

# 🌍 Resolve Location from Coordinates
@app.route('/resolve-location', methods=['POST'])
def resolve_location():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')
    try:
        response = requests.get(
            f'https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}',
            headers={'User-Agent': 'zara-app'}
        )
        if response.ok:
            address = response.json().get('display_name', 'Unknown location')
            return jsonify({'address': f"You are currently near: {address}"})
        return jsonify({'address': "Unable to fetch address."})
    except Exception as e:
        return jsonify({'address': f"Something went wrong: {str(e)}"})

# 🌐 Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/developer')
def developer():
    if session.get('dev_mode'):
        return render_template('developer.html')
    else:
        return redirect(url_for('home'))

# 🧠 Learning System - Store new answers
@app.route('/learn', methods=['POST'])
def learn():
    data = request.get_json()
    question = data.get('question').strip().lower()
    answer = data.get('answer').strip()
    user_memory[question] = answer
    return jsonify({'message': f"Zara learned: '{question}' is '{answer}'"})

# ✅ Run App
if __name__ == "__main__":
    app.run(debug=True)
