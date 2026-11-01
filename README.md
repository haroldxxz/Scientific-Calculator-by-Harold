# Spade

Spade is a scientific calculator built with React, JavaScript, and Vite. Capacitor
packages the same app as a native Android application.

## Run in a browser

```sh
npm install
npm run dev
```

## Build for Android

Install [Android Studio](https://developer.android.com/studio) with the Android
SDK, and install a supported JDK. Then add the Android project once:

```sh
npm install
npx cap add android
```

Build the web app and synchronize it with the Android project:

```sh
npm run android:sync
```

Open the native project in Android Studio:

```sh
npm run android:open
```

In Android Studio, run the app on a connected device/emulator or use **Build >
Build Bundle(s) / APK(s) > Build APK(s)** to create an installable APK.

After changing web code, run `npm run android:sync` again before rebuilding the
Android app. The Android project is generated locally by Capacitor and should be
included in version control once created.
