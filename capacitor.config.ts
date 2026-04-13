import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pandastracker.app',
  appName: 'PANDAS Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.pandastracker.com'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#176F91',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#176F91'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
