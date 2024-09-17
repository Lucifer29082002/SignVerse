import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonText } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import './Mic.css';

// Mock translation function
const mockTranslate = (text: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // This is a very simplistic mock translation
      const translated = text.split('').reverse().join('');
      resolve(translated);
    }, 500); // Simulate network delay
  });
};

const Mic: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeTime, setActiveTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [mode, setMode] = useState<'record' | 'transcribe'>('record');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = setInterval(() => {
        setActiveTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  useEffect(() => {
    checkPermissions();
    SpeechRecognition.addListener('speechRecognitionPartialResults', (result) => {
      console.log('Partial result:', result);
      setTranscription(result.matches[0]);
    });
    return () => {
      SpeechRecognition.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (transcription) {
      console.log('Transcription updated:', transcription);
      translateText(transcription);
    }
  }, [transcription]);

  const checkPermissions = async () => {
    const { available } = await SpeechRecognition.available();
    if (available) {
      const { state } = await SpeechRecognition.hasPermission();
      if (state !== 'granted') {
        await SpeechRecognition.requestPermission();
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const toggleFunction = async () => {
    if (isActive) {
      if (mode === 'record') {
        await stopRecording();
      } else {
        await stopSpeechRecognition();
      }
      setIsActive(false);
      setStatus('Stopped');
    } else {
      setAudioUrl(null);
      setTranscription('');
      setTranslation('');
      setActiveTime(0);
      if (mode === 'record') {
        await startRecording();
      } else {
        await startSpeechRecognition();
      }
      setIsActive(true);
      setStatus(mode === 'record' ? 'Recording' : 'Listening');
    }
  };

  const startRecording = async () => {
    try {
      await VoiceRecorder.requestAudioRecordingPermission();
      await VoiceRecorder.startRecording();
      setStatus('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('Error starting recording');
      alert('Microphone access is required to record audio.');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();
      const base64Sound = result.value.recordDataBase64;
      const audioBlob = base64ToBlob(base64Sound, 'audio/wav');
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setStatus('Recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
      setStatus('Error stopping recording');
    }
  };

  const startSpeechRecognition = async () => {
    try {
      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 2,
        prompt: 'Say something',
        partialResults: true,
        popup: false,
      });
      setStatus('Speech recognition started');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setStatus('Error starting speech recognition');
    }
  };

  const stopSpeechRecognition = async () => {
    try {
      await SpeechRecognition.stop();
      setStatus('Speech recognition stopped');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setStatus('Error stopping speech recognition');
    }
  };

  const base64ToBlob = (base64: string, type: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: type });
  };

  const translateText = async (text: string) => {
    try {
      const translatedText = await mockTranslate(text);
      setTranslation(translatedText);
      console.log('Translation updated:', translatedText);
    } catch (error) {
      console.error('Error translating text:', error);
      setStatus('Error translating text');
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div id="container">
          <div className="mode-toggle">
            <button 
              onClick={() => setMode('record')} 
              className={mode === 'record' ? 'active' : ''}
            >
              Record Audio
            </button>
            <button 
              onClick={() => setMode('transcribe')} 
              className={mode === 'transcribe' ? 'active' : ''}
            >
              Speech to Text
            </button>
          </div>

          <div className="mic-container">
            <button onClick={toggleFunction} className={`mic-button ${isActive ? 'stop' : ''}`}>
              <FontAwesomeIcon icon={isActive ? faStop : faMicrophone} size="2x" color="#fff" />
            </button>
          </div>

          <IonText color="medium">
            <p>{status}</p>
          </IonText>

          {isActive && (
            <div className="timer">
              {mode === 'record' ? 'Recording' : 'Listening'}: {formatTime(activeTime)}
            </div>
          )}

          {mode === 'record' && audioUrl && (
            <div className="audio-controls">
              <audio controls src={audioUrl}></audio>
            </div>
          )}

          <div className="text-output">
            {transcription && (
              <div className="transcription">
                <h3>Transcription:</h3>
                <p>{transcription}</p>
              </div>
            )}
            {translation && (
              <div className="translation">
                <h3>Translation:</h3>
                <p>{translation}</p>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Mic;