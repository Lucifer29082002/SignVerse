import React, { useState, useEffect, useRef, Suspense } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, isPlatform } from '@ionic/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera, useAnimations } from '@react-three/drei';
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

function Model({ url, animationName, onAnimationComplete }: { url: string; animationName?: string; onAnimationComplete: () => void }) {
  const group = useRef<THREE.Group>();
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (group.current) {
      const box = new THREE.Box3().setFromObject(group.current);
      const center = box.getCenter(new THREE.Vector3());
      group.current.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      group.current.scale.multiplyScalar(scale);

      group.current.position.y = -size.y * scale * 0.5;
    }
  }, [scene]);

  useEffect(() => {
    Object.values(actions).forEach(action => action.stop());

    if (animationName && actions[animationName]) {
      const action = actions[animationName];
      action.reset().setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();

      action.getMixer().addEventListener('finished', onAnimationComplete);

      return () => {
        action.getMixer().removeEventListener('finished', onAnimationComplete);
      };
    }
  }, [actions, animationName, onAnimationComplete]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

interface SignLanguageAnimatorProps {
  inputSentence: string;
  onAnimationComplete?: () => void;
}

const SignLanguageAnimator: React.FC<SignLanguageAnimatorProps> = ({ inputSentence, onAnimationComplete }) => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
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

          let buffer: ArrayBuffer;
          if (typeof result.data === 'string') {
            const base64 = result.data.split(',')[1] || result.data;
            buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
          } else {
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

  useEffect(() => {
    console.log('Input sentence changed:', inputSentence);
    if (inputSentence && modelUrl) {
      const letters = inputSentence.toUpperCase().split('');
      const validAnimations = letters.filter(letter => /[A-Z]/.test(letter));
      console.log('Setting animation queue:', validAnimations);
      setAnimationQueue(validAnimations);
    }
  }, [inputSentence, modelUrl]);

  useEffect(() => {
    console.log('Animation queue updated:', animationQueue);
    if (animationQueue.length > 0 && !currentAnimation) {
      playNextAnimation();
    } else if (animationQueue.length === 0 && !currentAnimation) {
      console.log('Animation sequence complete');
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  }, [animationQueue, currentAnimation]);

  const playNextAnimation = () => {
    if (animationQueue.length > 0) {
      const nextAnimation = animationQueue[0];
      console.log('Playing animation:', nextAnimation);
      setCurrentAnimation(nextAnimation);
      setAnimationQueue(prevQueue => prevQueue.slice(1));
    }
  };

  const handleAnimationComplete = () => {
    console.log('Animation completed:', currentAnimation);
    setCurrentAnimation(null);
  };

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{
          padding: '10px 50px',
          textAlign: 'center',
          backgroundColor: '#2E3B55', /* Matching the background color of the input box */
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', /* Matching the box shadow */
          color: '#f8f8ff', /* Matching the text color of the input box */
          fontFamily: 'monospace',
          fontSize: '15px',
        }}>
          <h1>Sign Verse</h1>
          <div>Current Animation: {currentAnimation || 'None'}</div>
        </div>

        <div style={{ width: '100%', height: '80%' }}>
          {error ? (
            <div>{error}</div>
          ) : modelUrl ? (
            <Canvas
              onCreated={({ gl, scene }) => {
                scene.background = new THREE.Color('#2E3B55');
                gl.setClearColor('#2E3B55', 1);
              }}
            >
              <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={40} />

              {/* Ambient light for overall illumination */}
              <ambientLight intensity={0.6} />

              {/* Main directional light (simulating sunlight) */}
              <directionalLight
                position={[5, 5, 5]}
                intensity={0.7}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />

              {/* Fill light from the opposite side */}
              <directionalLight
                position={[-5, 3, -5]}
                intensity={0.4}
                color="#9090ff"
              />

              {/* Soft light from below for subtle highlights */}
              <pointLight position={[0, -3, 0]} intensity={0.2} color="#ffcc77" />

              {/* Additional point lights for dynamic lighting */}
              <pointLight position={[3, 2, 1]} intensity={0.3} color="#ffffff" />
              <pointLight position={[-3, 2, 1]} intensity={0.3} color="#ffffff" />

              <Suspense fallback={null}>
                <Model url={modelUrl} animationName={currentAnimation || undefined} onAnimationComplete={handleAnimationComplete} />
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

export default SignLanguageAnimator;