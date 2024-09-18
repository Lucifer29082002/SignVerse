import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import SignLanguageAnimator from '../components/space/Space';

interface HomeProps {
  realInput: string;
}

const Home: React.FC<HomeProps> = ({ realInput }) => {
  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
          </IonToolbar>
        </IonHeader>
        <SignLanguageAnimator inputSentence={realInput} />
      </IonContent>
    </IonPage>
  );
};

export default Home;