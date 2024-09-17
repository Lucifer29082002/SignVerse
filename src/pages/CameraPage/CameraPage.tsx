import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import './CameraPage.css';

const CameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recordedVideos, setRecordedVideos] = useState<{url: string, blob: Blob}[]>([]);

  const startStopCamera = async () => {
    if (cameraStream) {
      // Stop the current camera stream
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsRecording(false);
      setRecordedChunks([]);
      setRecordedVideos([]);
    } else {
      // Start a new camera stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play(); // Ensure the video starts playing
          }
          setCameraStream(stream);
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks((prev) => [...prev, event.data]);
            }
          };
        } catch (error) {
          console.error('Error accessing media devices:', error);
        }
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setTimer(0);
        timerIntervalRef.current = setInterval(() => {
          setTimer((prev) => prev + 1);
        }, 1000);
      }
    }
  };

  const saveVideo = () => {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    const url = window.URL.createObjectURL(blob);

    setRecordedVideos(prev => [...prev, { url, blob }]);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `video_${new Date().getTime()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a); // Clean up the link element

    // Optionally, revoke the object URL to free memory
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
    
    alert('Video saved!');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Camera</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="video-container">
          <video ref={videoRef} autoPlay />
          {isRecording && (
            <div className="recording-indicator">
              <p>Recording... {formatTime(timer)}</p>
            </div>
          )}
        </div>
        <IonButton expand="full" onClick={startStopCamera}>
          {cameraStream ? 'Stop Camera' : 'Start Camera'}
        </IonButton>
        {cameraStream && (
          <>
            <IonButton expand="full" onClick={toggleRecording}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </IonButton>
            <IonButton expand="full" onClick={saveVideo}>Save Video</IonButton>
          </>
        )}
        <div className="recorded-videos">
          {recordedVideos.map((video, index) => (
            <div key={index} className="video-item">
              <video src={video.url} controls width="100%" />
              <IonButton expand="full" onClick={() => window.open(video.url)}>Open in new tab</IonButton>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CameraPage;
