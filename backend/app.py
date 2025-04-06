from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from langdetect import detect
from gtts import gTTS
import os
import random
from datetime import datetime

app = Flask(__name__, template_folder="../frontend", static_folder="../frontend/static")
CORS(app)

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

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get('message', '').lower()

    try:
        lang = detect(user_message)
    except:
        lang = 'en'

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
        current_time = datetime.now().strftime('%I:%M %p')
        reply = f"The current time is {current_time}."
    else:
        reply = "Sorry, I didn't understand that. Could you say it again?"

    return jsonify({'reply': reply, 'audio': None})

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
