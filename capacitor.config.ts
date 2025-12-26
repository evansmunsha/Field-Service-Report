import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fieldservicereport.app",
  appName: "Field Service Report",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "logo",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#10b981",
    },
    StatusBar: {
      style: "default",
      backgroundColor: "#0f172a",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    App: {
      launchUrl: "https://fieldservicereport.app",
    },
    BackgroundSync: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: "logo",
      iconColor: "#10b981",
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: "AAB",
      signingType: "apksigner",
    },
    webContentsDebuggingEnabled: false,
  },
};

export default config;
