
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9b857b5d65f3447191d07f233d2ad2c2',
  appName: 'survey-sync-nexus',
  webDir: 'dist',
  server: {
    url: "https://9b857b5d-65f3-4471-91d0-7f233d2ad2c2.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#f2f2f2",
      androidScaleType: "CENTER_CROP",
      splashImmersive: true
    }
  }
};

export default config;
