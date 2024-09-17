import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'SignVerse',
  webDir: 'dist',
  plugins: {
    Filesystem: {
      androidScheme: "content"
    },
    "SpeechRecognition": {
      "androidSpeechRecognizer": true
    }
  }
};

export default config;