from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from langdetect import detect
from gtts import gTTS
import os
import random
from datetime import datetime
import pytz
import requests

app = Flask(__name__, template_folder="../frontend", static_folder="../frontend/static")
CORS(app)

app.secret_key = 'your-super-secret-key'
def malayalam_response(user_message):
    if "പേര്" in user_message:
        return "എന്റെ പേര് കൈറയാണ്"
    elif "സമയം" in user_message:
        from datetime import datetime
        return f"ഇപ്പോൾ സമയം {datetime.now().strftime('%I:%M %p')} ആണ്"
    elif "നന്ദി" in user_message:
        return "എനിക്ക് സന്തോഷമാണ് ബോസ്!"
    elif "വിട" in user_message or "ബൈ" in user_message:
        return "കൈറ പോയി, വീണ്ടും വിളിക്കണേ ബോസ്!"
    else:
        return "അതെന്താണെന്ന് എനിക്ക് മനസ്സിലായില്ല ബോസ്!"

def generate_malayalam_audio(text):
    tts = gTTS(text=text, lang='ml')
    filename = f"Zara_ml_reply_{random.randint(1000,9999)}.mp3"
    filepath = os.path.join("frontend/static", filename)  # Save in frontend/static
    tts.save(filepath)
    return filename

def get_indian_time():
    india = pytz.timezone('Asia/Kolkata')
    india_time = datetime.now(india)
    return india_time.strftime('%I:%M %p')

import geocoder

def get_location():
    g = geocoder.ip('me')
    if g.ok:
        return f"Your current location is {g.city}, {g.state}, {g.country}"
    else:
        return "Sorry, I couldn't detect your location."


@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get('message', '').lower()

    try:
        lang = detect(user_message)
    except:
        lang = 'en'
    if "activate developer mode" in user_message:
        session['awaiting_dev_password'] = True
        return jsonify({'reply': "Please say the developer password.", 'audio': None})

    # 💡 Step 2: If password is being expected
    if session.get('awaiting_dev_password'):
        developer_password = "zara_dev_007"  # 🔐 Change this
        if user_message.strip() == developer_password:
            session['dev_mode'] = True
            session.pop('awaiting_dev_password', None)
            return jsonify({'reply': "Developer mode activated. Redirecting you now.", 'redirect': '/developer', 'audio': None})
        else:
            session.pop('awaiting_dev_password', None)
            return jsonify({'reply': "Incorrect password. Developer mode not activated.", 'audio': None})
    if lang == 'ml':
        reply = malayalam_response(user_message)
        audio_file = generate_malayalam_audio(reply)
        return jsonify({'reply': reply, 'audio': f'static/{audio_file}'})

    # English logic
    if "hello" in user_message:
        reply = "Hello! How can I help you today?"
    elif "how are you" in user_message:
        reply = "I'm doing great, thank you for asking!"
    elif "your name" in user_message:
        reply = "I'm Zara, your assistant!"
    elif "time" in user_message:
        current_time = get_indian_time()
        reply = f"The current time is {current_time}."
    elif "location" in user_message or "where am i" in user_message:
        reply = get_location()
    elif "Thanks" in user_message or "Thank you" in user_message:
        reply = "I am glad that I was able to help you in any way!."
    else:
        reply = "Sorry, I didn't understand that. Could you say it again?"

    return jsonify({'reply': reply, 'audio': None})

@app.route('/resolve-location', methods=['POST'])
def resolve_location():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')

    try:
        response = requests.get(
            f'https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}',
            headers={'User-Agent': 'kyra-assistant'}
        )
        if response.ok:
            info = response.json()
            address = info.get('display_name', 'Unknown location')
            return jsonify({'address': f"You are currently near: {address}"})
        else:
            print("Failed response:", response.text)
            return jsonify({'address': "Unable to fetch address."})
    except Exception as e:
        print("Reverse geocoding error:", e)
        return jsonify({'address': f"Something went wrong: {str(e)}"})

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/developer')
def developer():
    if session.get('dev_mode'):
        return render_template('developer.html')  # Create this page
    else:
        return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(debug=True)
