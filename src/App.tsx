import { useState } from 'react';
import { IonApp, IonContent, IonModal, IonButton } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faMicrophone, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import Home from './pages/Home';
import CameraPage from './pages/CameraPage/CameraPage';
import SpeechRecognitionUI from './pages/MicPage/micpage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* Import setupIonicReact */
import { setupIonicReact } from '@ionic/react';

setupIonicReact(); // Initialize Ionic React

const App: React.FC = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [input, setInput] = useState('');
  const [realInput, setRealInput] = useState('');

  const handleSubmit = () => {
    setRealInput(input);
  };

  return (
    <IonApp>
      <IonContent>
        <Home realInput={realInput} />

        {/* Placeholder for the model with an image */}
        <div className="model-placeholder">
          <img src="https://via.placeholder.com/150" alt="Model Placeholder" />
        </div>

        {/* Bottom Input Box */}
        <div className="bottom-input-box">
          <input
            type="text"
            placeholder="Enter text here..."
            onChange={(ev) => setInput(ev.target.value)}
          />

          {/* Arrow Button */}
          <IonButton className="custom-button" onClick={handleSubmit}>
  <FontAwesomeIcon icon={faPaperPlane} />
</IonButton>


          {/* Camera Button */}
          <IonButton className="custom-button" onClick={() => setIsCameraOpen(true)}>
            <FontAwesomeIcon icon={faCamera} />
          </IonButton>
        </div>

        {/* Camera Modal */}
        <IonModal isOpen={isCameraOpen} onDidDismiss={() => setIsCameraOpen(false)} className="ion-modal-custom">
  <div className="camera-modal-content">
    <CameraPage />
    <FontAwesomeIcon className="close-icon" icon={faTimes} onClick={() => setIsCameraOpen(false)} />
  </div>
</IonModal>


        {/* Mic Modal */}
        <IonModal isOpen={isMicOpen} onDidDismiss={() => setIsMicOpen(false)}>
          <SpeechRecognitionUI />
          <FontAwesomeIcon className="close-icon" icon={faTimes} onClick={() => setIsMicOpen(false)} />
        </IonModal>
      </IonContent>
    </IonApp>
  );
};

export default App;
