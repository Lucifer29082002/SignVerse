import React, { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop, faDownload } from '@fortawesome/free-solid-svg-icons';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Filesystem, Directory } from '@capacitor/filesystem';
import './Mic.css'; // We'll create this CSS file

const Mic: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await VoiceRecorder.requestAudioRecordingPermission();
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access is required to record audio.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();
      setIsRecording(false);
      const base64Sound = result.value.recordDataBase64;
      const audioBlob = base64ToBlob(base64Sound, 'audio/wav');
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setAudioBlob(audioBlob);
    } catch (error) {
      console.error('Error stopping recording:', error);
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

  const handleDownload = async () => {
    if (audioBlob) {
      try {
        const fileName = `recording_${new Date().getTime()}.wav`;
        const base64Data = await blobToBase64(audioBlob);
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents
        });
        console.log('File saved:', fileName);
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div id="container">
          <div className="mic-container">
            {!isRecording ? (
              <button onClick={handleStartRecording} className="mic-button">
                <FontAwesomeIcon icon={faMicrophone} size="2x" color="#fff" />
              </button>
            ) : (
              <button onClick={handleStopRecording} className="mic-button stop">
                <FontAwesomeIcon icon={faStop} size="2x" color="#fff" />
              </button>
            )}
          </div>

          {isRecording && (
            <div className="timer">
              Recording: {formatTime(recordingTime)}
            </div>
          )}

          {audioUrl && (
            <div className="audio-controls">
              <audio controls src={audioUrl}></audio>
              <button className="download" onClick={handleDownload}>
                <FontAwesomeIcon icon={faDownload} /> Download
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Mic;