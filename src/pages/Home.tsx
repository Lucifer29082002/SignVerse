import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import ModelViewer from '../components/space/Space';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>SignVerse</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">SignVerese</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ModelViewer/>
        <ExploreContainer />
      </IonContent>
    </IonPage>
  );
};

export default Home;
