import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonButton, IonIcon, IonText, IonToast } from '@ionic/react';
import { micOutline, stopCircleOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { VoiceRecorder } from 'capacitor-voice-recorder';

const SpeechRecognitionUI: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const listenerSetup = useRef(false);

  useEffect(() => {
    setupSpeechRecognition();
    return () => {
      cleanupSpeechRecognition();
    };
  }, []);

  const setupSpeechRecognition = async () => {
    try {
      const { available } = await SpeechRecognition.available();
      if (available) {
        await requestPermissions();
        if (!listenerSetup.current) {
          SpeechRecognition.addListener('partialResults', handlePartialResults);
          SpeechRecognition.addListener('start', handleStart);
          SpeechRecognition.addListener('stop', handleStop);
          SpeechRecognition.addListener('error', handleError);
          SpeechRecognition.addListener('listeningState', handleListeningState);
          listenerSetup.current = true;
        }
      } else {
        setStatus('Speech recognition not available');
        showToastMessage('Speech recognition is not available on this device');
      }
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
      setStatus('Error setting up speech recognition');
      showToastMessage('Failed to set up speech recognition');
    }
  };

  const cleanupSpeechRecognition = async () => {
    if (listenerSetup.current) {
      await SpeechRecognition.removeAllListeners();
      listenerSetup.current = false;
    }
  };

  const requestPermissions = async () => {
    try {
      await SpeechRecognition.requestPermission();
      if (Capacitor.getPlatform() === 'android') {
        await VoiceRecorder.requestAudioRecordingPermission();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setStatus('Error requesting permissions');
      showToastMessage('Failed to get necessary permissions');
    }
  };

  const handlePartialResults = (result: { value: string[] }) => {
    console.log('Partial results:', result);
    if (result.value && result.value.length > 0) {
      setTranscription(result.value[0]);
    }
  };

  const handleStart = () => {
    console.log('Speech recognition started');
    setStatus('Listening started');
    setIsListening(true);
  };

  const handleStop = () => {
    console.log('Speech recognition stopped');
    setStatus('Listening stopped');
    setIsListening(false);
    if (!transcription) {
      showToastMessage('No speech detected. Please try again.');
    }
  };

  const handleError = (error: any) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    if (error.message === 'No match') {
      setStatus('No speech detected');
      showToastMessage('No speech detected. Please try again.');
    } else {
      setStatus(`Error: ${error.message}`);
      showToastMessage(`Speech recognition error: ${error.message}`);
    }
  };

  const handleListeningState = (state: { isListening: boolean }) => {
    console.log('Listening state changed:', state);
    setIsListening(state.isListening);
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await stopListening();
      } else {
        await startListening();
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      setStatus('Error toggling speech recognition');
      showToastMessage('Failed to toggle speech recognition');
    }
  };

  const startListening = async () => {
    setTranscription('');
    try {
      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 2,
        prompt: 'Say something',
        partialResults: true,
        popup: false,
      });
      setStatus('Starting to listen...');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      setStatus('Error starting speech recognition');
      showToastMessage('Failed to start speech recognition');
    }
  };

  const stopListening = async () => {
    try {
      await SpeechRecognition.stop();
      setStatus('Stopping listening...');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setStatus('Error stopping speech recognition');
      showToastMessage('Failed to stop speech recognition');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full">
          <IonButton
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full ${isListening ? 'ion-color-danger' : 'ion-color-primary'}`}
          >
            <IonIcon icon={isListening ? stopCircleOutline : micOutline} className="text-4xl" />
          </IonButton>

          <IonText color="medium" className="mt-4">
            <p>{status}</p>
          </IonText>

          <div className="bg-gray-100 p-4 rounded-md mt-6 w-full max-w-md max-h-60 overflow-y-auto">
            <IonText>
              <p>{transcription}</p>
            </IonText>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default SpeechRecognitionUI;