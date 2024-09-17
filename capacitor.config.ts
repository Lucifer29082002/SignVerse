import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'SignVerse',
  webDir: 'dist',
  plugins: {
    Filesystem: {
      androidScheme: "content"
    }
  }
};

export default config;