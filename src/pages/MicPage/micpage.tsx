import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop, faDownload } from '@fortawesome/free-solid-svg-icons';
import './micpage.css';

const Mic: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Helper function to format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      setAudioUrl(null);
      setAudioBlob(null);
      audioChunks.current = [];
      setIsRecording(true);
      setRecordingTime(0); // Reset the recording time

      // Start the timer
      timerInterval.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);

        // Stop the timer
        if (timerInterval.current) clearInterval(timerInterval.current);
      };

      mediaRecorder.current.start();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required to record audio.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const handleDownload = () => {
    if (audioBlob) {
      const url = window.URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'recording.wav';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up the timer when the component unmounts
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  return (
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

      {/* Display the recording time while recording */}
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
  );
};

export default Mic;
