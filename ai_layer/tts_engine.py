import threading
import os
import time

# Attempt to import pyttsx3. If not available, we'll fall back to mock speech.
try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

class OfflineTTSEngine:
    def __init__(self):
        self.engine = None
        self.lock = threading.Lock()
        if TTS_AVAILABLE:
            try:
                # Initialize local TTS engine
                self.engine = pyttsx3.init()
                # Set properties: slow down rate slightly for military tactical feel
                self.engine.setProperty('rate', 150) 
                self.engine.setProperty('volume', 1.0)
                
                # Try to select a male or deep voice if available, else default
                voices = self.engine.getProperty('voices')
                if len(voices) > 1:
                    # Often index 0 is male, index 1 is female in Windows SAPI5
                    self.engine.setProperty('voice', voices[0].id)
            except Exception as e:
                print(f"TTS Init Error: {e}. Falling back to visual log.")
                self.engine = None

    def speak(self, text: str):
        """Speaks the text aloud in a background thread to prevent blocking."""
        if not self.engine:
            print(f"[Speech Simulated]: {text}")
            return
        
        def _speak_thread():
            with self.lock:
                try:
                    self.engine.say(text)
                    self.engine.runAndWait()
                except Exception as e:
                    print(f"TTS Playback Error: {e}")

        thread = threading.Thread(target=_speak_thread)
        thread.start()

    def save_to_file(self, text: str, output_path: str) -> bool:
        """Saves the speech synthesis output as an audio file."""
        if not self.engine:
            return False

        with self.lock:
            try:
                # Save as audio file
                self.engine.save_to_file(text, output_path)
                self.engine.runAndWait()
                # Give the OS a tiny window to write the file
                time.sleep(0.1)
                return os.path.exists(output_path)
            except Exception as e:
                print(f"TTS File Render Error: {e}")
                return False

if __name__ == "__main__":
    tts = OfflineTTSEngine()
    tts.speak("Tactical co pilot online. Awaiting commands.")
    time.sleep(3)
