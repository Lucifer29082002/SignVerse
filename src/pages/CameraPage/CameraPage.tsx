import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/react';
import { cameraOutline, closeOutline, videocamOutline, stopOutline } from 'ionicons/icons';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { Capacitor } from '@capacitor/core';
import './Camera-page.css';

const CameraPage: React.FC = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
    };
  }, [cameraActive]);

  const startCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      const cameraPreviewOptions: CameraPreviewOptions = {
        position: 'rear',
        parent: 'camera-preview',
        className: 'camera-preview',
        toBack: false,
        width: 300,
        height: 400,
        x: 45,
        y: 95,
        disableAudio: false,
        enableHighResolution: true
      };

      try {
        await CameraPreview.start(cameraPreviewOptions);
        setCameraActive(true);
      } catch (error) {
        console.error('Failed to start camera:', error);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setVideoStream(stream);
        const videoElement = document.getElementById('camera-preview-web') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play();
        }
        setCameraActive(true);
      } catch (error) {
        console.error('Failed to start camera:', error);
      }
    }
  };

  const stopCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await CameraPreview.stop();
      } catch (error) {
        console.error('Failed to stop camera:', error);
      }
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    }
    setCameraActive(false);
  };

  const toggleRecording = async () => {
    if (Capacitor.isNativePlatform()) {
      if (isRecording) {
        try {
          const result = await CameraPreview.stopRecording();
          console.log('Recording stopped:', result);
          setIsRecording(false);
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }
      } else {
        try {
          await CameraPreview.startRecording({
            quality: 'high',
            width: 300,
            height: 400,
            maxDuration: 60000 // 1 minute
          });
          setIsRecording(true);
        } catch (error) {
          console.error('Failed to start recording:', error);
        }
      }
    } else {
      console.log('Recording not implemented for web version');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Camera Preview</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="camera-container">
          {Capacitor.isNativePlatform() ? (
            <div id="camera-preview" className="camera-preview"></div>
          ) : (
            <video id="camera-preview-web" className="camera-preview" playsInline></video>
          )}
        </div>
        <div className="camera-controls">
          <IonButton onClick={cameraActive ? stopCamera : startCamera}>
            <IonIcon icon={cameraActive ? closeOutline : cameraOutline} />
            {cameraActive ? 'Stop Camera' : 'Start Camera'}
          </IonButton>
          {cameraActive && Capacitor.isNativePlatform() && (
            <IonButton onClick={toggleRecording} color={isRecording ? 'danger' : 'success'}>
              <IonIcon icon={isRecording ? stopOutline : videocamOutline} />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CameraPage;