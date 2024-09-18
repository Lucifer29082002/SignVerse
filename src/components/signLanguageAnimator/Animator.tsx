import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton } from '@ionic/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Import your existing Model component
import { Model } from './ModelComponent';

const SignLanguageAnimator: React.FC = () => {
  const [sentence, setSentence] = useState<string>('');
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const modelRef = useRef<THREE.Group>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animateSentence = () => {
    setIsAnimating(true);
    animateNextLetter(0);
  };

  const animateNextLetter = (index: number) => {
    if (index < sentence.length) {
      const letter = sentence[index].toUpperCase();
      if (/[A-Z]/.test(letter)) {
        setCurrentLetter(letter);
        
        // Set a timeout for the next letter (adjust timing as needed)
        timeoutRef.current = setTimeout(() => {
          animateNextLetter(index + 1);
        }, 1000); // 1 second per letter, adjust as needed
      } else {
        // If it's not a letter, move to the next character immediately
        animateNextLetter(index + 1);
      }
    } else {
      setIsAnimating(false);
      setCurrentLetter(null);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign Language Animator</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '10px' }}>
          <IonInput
            value={sentence}
            placeholder="Enter a sentence"
            onIonChange={e => setSentence(e.detail.value!)}
          />
          <IonButton onClick={animateSentence} disabled={isAnimating || !sentence}>
            Animate
          </IonButton>
        </div>
        <div style={{ width: '100%', height: '80%' }}>
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            <Model url="/assets/newModel.glb" animationName={currentLetter || undefined} />
            <OrbitControls 
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
              minDistance={2}
              maxDistance={4}
            />
          </Canvas>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignLanguageAnimator;