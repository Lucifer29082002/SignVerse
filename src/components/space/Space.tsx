import React, { Suspense, useState, useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, isPlatform } from '@ionic/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as THREE from 'three';


async function copyModelToDataDirectory() {
  if (isPlatform('android')) {
    try {
      const modelExists = await Filesystem.readFile({
        path: 'newModel.glb',
        directory: Directory.Data
      }).catch(() => null);

      if (!modelExists) {
        console.log('Model does not exist in Data directory, copying from assets...');
        const modelData = await fetch('file:///android_asset/newModel.glb')
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
          });
        
        await Filesystem.writeFile({
          path: 'newModel.glb',
          data: modelData,
          directory: Directory.Data
        });
        console.log('Model copied successfully to Data directory');
      } else {
        console.log('Model already exists in Data directory');
      }
    } catch (error) {
      console.error('Error in copyModelToDataDirectory:', error);
    }
  }
}

function Model({ url }: { url: string }) {
    const group = useRef<THREE.Group>();
    const { scene } = useGLTF(url);
  
    useEffect(() => {
      if (group.current) {
        // Center the model
        const box = new THREE.Box3().setFromObject(group.current);
        const center = box.getCenter(new THREE.Vector3());
        group.current.position.sub(center);
  
        // Scale the model to fit the view
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        group.current.scale.multiplyScalar(scale);
  
        // Move the model up to show upper half
        group.current.position.y = -size.y * scale * 0.7;
    }
    }, [scene]);
  
    useFrame((state) => {
      if (group.current) {
        // Optional: Add some subtle animation
        group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      }
    });
  
    return (
      <group ref={group}>
        <primitive object={scene} />
      </group>
    );
  }
  
  const ModelViewer: React.FC = () => {
    const [modelUrl, setModelUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      async function loadModel() {
        try {
          if (isPlatform('android')) {
            await copyModelToDataDirectory();
            const result = await Filesystem.readFile({
              path: 'newModel.glb',
              directory: Directory.Data
            });
  
            console.log('File read result:', result);
            console.log('File data type:', typeof result.data);
            console.log('File data length:', result.data.length);
  
            let buffer: ArrayBuffer;
  
            if (typeof result.data === 'string') {
              // It's Base64 encoded, decode it
              const base64 = result.data.split(',')[1] || result.data;
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              buffer = bytes.buffer;
            } else {
              // It's already binary data
              buffer = result.data;
            }
  
            const blob = new Blob([buffer], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            setModelUrl(url);
          } else {
            setModelUrl('/assets/newModel.glb');
          }
        } catch (error) {
          console.error('Error loading model:', error);
          setError('Failed to load 3D model. Please check console for details.');
        }
      }
      loadModel();
    }, []);
  
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>3D Model Viewer</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div style={{ width: '100%', height: '100%' }}>
            {error ? (
              <div>{error}</div>
            ) : modelUrl ? (
              <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                <Suspense fallback={null}>
                  <Model url={modelUrl} />
                </Suspense>
                <OrbitControls 
                  enablePan={false}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 2}
                  minDistance={2}
                  maxDistance={4}
                />
              </Canvas>
            ) : (
              <div>Loading model...</div>
            )}
          </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default ModelViewer;