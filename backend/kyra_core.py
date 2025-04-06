import speech_recognition as sr
import pyttsx3
import random
import datetime
import os
import time
from googletrans import Translator
from langdetect import detect
import requests
from PIL import Image
from io import BytesIO
from urllib.parse import quote
import face_recognition
import cv2


# Initialize TTS Engine
engine = pyttsx3.init()
voices = engine.getProperty('voices')

# Set Female Voice
for voice in voices:
    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
        engine.setProperty('voice', voice.id)
        break

ART_FOLDER = 'A:/Assistant/chatbot/zarabot/Zara_Arts'
os.makedirs(ART_FOLDER, exist_ok=True)

translator = Translator()

#global variables
image = None

def greet():
    hour = datetime.datetime.now().hour
    if 0 <= hour < 12:
        speak("Good morning, Boss enthund?")
    elif 12 <= hour < 18:
        speak("Good afternoon sakhavu, enthund Boss?")
    else:
        speak("Good evening sakhavu, enthund Boss?")

from gtts import gTTS
import playsound

def speak(text):
    try:
        print("Kyra:", text)
        tts = gTTS(text=text, lang='ml')
        path = "zara.mp3"
        tts.save(path)

        playsound.playsound(path)
        os.remove(path)
    except PermissionError:
        print("Permission denied error while saving audio.")
    except Exception as e:
        print(f"Error: {e}")



def listen():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = recognizer.listen(source, timeout=5)
            command = recognizer.recognize_google(audio, language='ml-IN')
            print(f"You: {command}")
            
            detected_lang = detect(command)
            print(f"Detected Language: {detected_lang}")

            if detected_lang != 'ml':
                translated = translator.translate(command, dest='ml')
                print(f"Translated Command: {translated.text}")
                return translated.text.lower()
            return command.lower()
        except sr.UnknownValueError:
            speak("ഞാൻ കേട്ടില്ല")
            return "None"
        except sr.RequestError:
            speak("Google service illathath kond patilla")
            return "None"
        except sr.WaitTimeoutError:
            speak("Boss, നിങ്ങൾ ഒന്നും പറഞ്ഞില്ല")
            return "None"
        
AVATAR_STYLES = {
        "അഡ്വഞ്ചറർ": "adventurer",
        "അവതാർ": "avataaars",
        "ബോട്ട്സ്": "bottts",
        "ക്രൂഡിൽസ്": "croodles",
        "ഐഡന്റിക്കോൺ": "identicon",
        "പിക്സൽ ആർട്ട്": "pixel-art",
        "തമ്പ്സ്": "thumbs",
        "മിനി അവറ്റാർസ്": "miniavs"
        }

def generate_image(prompt, style="adventurer"):
    encoded_prompt = quote(prompt)
    api_url = f'https://api.dicebear.com/7.x/{style}/png?seed={encoded_prompt}'
    
    response = requests.get(api_url)
    if response.status_code == 200:
        image = Image.open(BytesIO(response.content))
        image.show()
        return image
    else:
        speak(f"Sorry Boss, I couldn't generate the image with style {style}")
        return None

def ask_image_type():
    speak("Boss, what kind of image would you like? Here are the options:")
    for style in AVATAR_STYLES:
        speak(style)
        time.sleep(0.5)
    speak("Please select one")
    
    chosen_style = listen()
    if chosen_style in AVATAR_STYLES:
        return chosen_style
    else:
        speak("Sorry Boss, I didn't understand the style. I'll use adventurer by default.")
        return "adventurer"
    
def kyra_reply(user_input):
    response = f"Kyra heard you say: {user_input}"
    return response


# Save Image Function
def save_image(image, filename):
    file_path = os.path.join(ART_FOLDER, filename)
    image.save(file_path)
    speak(f"Image saved as {filename}")

def main():
    global image
    greet()
    while True:
        command = listen()
        if 'നിക്കു' in command or 'bye' in command or 'exit' in command:
            speak("Kyra ഒരു യാത്രയിലേക്കാണ് പോകുന്നത്... എങ്കിലും ഒരു വിളിപ്പാടിന് സദാ തയ്യാറാണ്... വീണ്ടും വിളിക്കണേ Boss!")
            break
        elif 'പേര്' in command:
            speak("എന്റെ പേര് കയ്റ")
        elif 'സമയം' in command or 'time' in command:
            current_time = datetime.datetime.now().strftime("%I:%M %p")
            speak(f"Boss, സമയം {current_time} ആണ്")
        elif 'thank you' in command or 'നന്ദി' in command:
            speak("ബോസ്, എന്തിനാണ് നന്ദി, നിങ്ങളെ സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്")
        elif "ഇമേജ്" in command or "create" in command:
            prompt = command.replace("ഇമേജ്", "").strip()
            style = ask_image_type()
            image = generate_image(prompt, style)
            if image:
                speak("Boss, here's your image")
        elif "I like this pic" in command or "എനിക്ക് ഇഷ്ടപ്പെട്ടു" in command:
            if image:
                filename = f"image_{random.randint(1000, 9999)}.png"
                save_image(image, filename)
            else:
                speak("No image is available to save")
        elif "നീ ആരാണ്" in command :
            speak("ഞാൻ കൈറയാണ്! 🦾 നിങ്ങളുടെ സ്വന്തം സ്മാർട്ട് അസിസ്റ്റന്റ്. കമാൻഡ് കൊടുത്താൽ എല്ലാം ചെയ്‌തുതരാം... അതോ ഒരു ചായയോ വേണോ? 😄")
            
        else:
            speak("എനിക്ക് അതറിയില്ല Boss")

if __name__ == "__main__":
    main()
