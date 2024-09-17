import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/react';
import { cameraOutline, closeOutline, videocamOutline, stopOutline, downloadOutline, openOutline } from 'ionicons/icons';
import './CameraPage.css';
import * as Hands from '@mediapipe/hands';
import * as Camera from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const CameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recordedVideos, setRecordedVideos] = useState<{ url: string, blob: Blob }[]>([]);
  const handsRef = useRef<Hands.Hands | null>(null);
  const cameraRef = useRef<Camera.Camera | null>(null);

  useEffect(() => {
    const setupHands = async () => {
      handsRef.current = new Hands.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      handsRef.current.setOptions({
        maxNumHands: 2, // Track both hands
        modelComplexity: 1, // More complex and accurate model
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handsRef.current.onResults(onResults);

      if (videoRef.current) {
        cameraRef.current = new Camera.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280, // Increased resolution for better tracking
          height: 720
        });
      }
    };

    setupHands();
  }, []);

  const onResults = (results: Hands.Results) => {
    const canvasCtx = canvasRef.current?.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw hand connections and landmarks
        drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
      }
    }

    canvasCtx.restore();
  };

  const startStopCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsRecording(false);
      setRecordedChunks([]);
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    } else {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraStream(stream);
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks((prev) => [...prev, event.data]);
            }
          };
          if (cameraRef.current) {
            cameraRef.current.start();
          }
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
    document.body.removeChild(a);

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
          <IonTitle>Camera with Hand Detection</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="video-container">
          <video ref={videoRef} autoPlay style={{ display: 'none' }} />
          <canvas ref={canvasRef} width="640" height="480" style={{ maxWidth: '100%' }} />
          {isRecording && (
            <div className="recording-indicator">
              <p>Recording... {formatTime(timer)}</p>
            </div>
          )}
        </div>
        <div className="controls">
          <IonButton onClick={startStopCamera} color="primary" shape="round" size="large">
            <IonIcon icon={cameraStream ? closeOutline : cameraOutline} />
          </IonButton>
          {cameraStream && (
            <>
              <IonButton onClick={toggleRecording} color={isRecording ? 'danger' : 'success'} shape="round" size="large">
                <IonIcon icon={isRecording ? stopOutline : videocamOutline} />
              </IonButton>
              {recordedChunks.length > 0 && (
                <IonButton onClick={saveVideo} color="tertiary" shape="round" size="large">
                  <IonIcon icon={downloadOutline} />
                </IonButton>
              )}
            </>
          )}
        </div>
        <div className="recorded-videos">
          {recordedVideos.length > 0 && <h3>Recorded Videos:</h3>}
          {recordedVideos.map((video, index) => (
            <div key={index} className="video-item">
              <video src={video.url} controls width="100%" />
              <IonButton expand="full" onClick={() => window.open(video.url)}>
                <IonIcon icon={openOutline} />
              </IonButton>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CameraPage;
