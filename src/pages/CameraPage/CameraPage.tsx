import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
  }
}

const PoseDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getBackCamera = async (): Promise<string | undefined> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    // Typically, the back camera is the last in the list of video devices
    const backCamera = videoDevices[videoDevices.length - 1];
    return backCamera?.deviceId;
  };

  useEffect(() => {
    const loadMediaPipeModules = async () => {
      await import('@mediapipe/pose');
      await import('@mediapipe/drawing_utils');
      await import('@mediapipe/camera_utils');
      
      const { Pose } = window;
      const { Camera } = window;
      const { drawConnectors, drawLandmarks } = window;

      if (!Pose || !Camera || !drawConnectors || !drawLandmarks) {
        console.error('MediaPipe modules not loaded correctly');
        return;
      }

      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);

      if (videoRef.current) {
        const backCameraId = await getBackCamera();
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await pose.send({image: videoRef.current});
            }
          },
          width: 1280,
          height: 720,
          facingMode: 'environment',
          deviceId: backCameraId
        });
        camera.start().then(() => setIsLoading(false));
      }

      return () => {
        pose.close();
      };
    };

    loadMediaPipeModules();
  }, []);

  const onResults = (results: any) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext('2d');

    if (canvasElement && canvasCtx) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.poseLandmarks) {
        window.drawConnectors(canvasCtx, results.poseLandmarks, window.Pose.POSE_CONNECTIONS,
                       {color: '#00FF00', lineWidth: 4});
        window.drawLandmarks(canvasCtx, results.poseLandmarks,
                      {color: '#FF0000', lineWidth: 2});
      }
      canvasCtx.restore();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pose Detection</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {isLoading && <div>Loading...</div>}
        <video ref={videoRef} style={{display: 'none'}}></video>
        <canvas ref={canvasRef} width="1280" height="1400" style={{maxWidth: '100%', height: 'auto'}}></canvas>
      </IonContent>
    </IonPage>
  );
};

export default PoseDetection;