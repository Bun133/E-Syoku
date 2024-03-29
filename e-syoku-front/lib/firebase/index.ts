"use client"
import * as firebase from "firebase/app"
import {FirebaseApp} from "firebase/app"
import {FirebaseOptions} from "@firebase/app";
import {connectStorageEmulator, getStorage} from "@firebase/storage";

export const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_apiKey,
    authDomain: process.env.NEXT_PUBLIC_authDomain,
    projectId: process.env.NEXT_PUBLIC_projectId,
    storageBucket: process.env.NEXT_PUBLIC_storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId,
    appId: process.env.NEXT_PUBLIC_appId,
    measurementId: process.env.NEXT_PUBLIC_measurementId
}

firebase.initializeApp(firebaseConfig)
export const firebaseApp: FirebaseApp = firebase.getApp()

if (process.env.NODE_ENV === "development") {
    // Connect Storage Emulator
    console.log("Connecting Storage Emulator")
    const storage = getStorage(firebaseApp)
    connectStorageEmulator(storage, "localhost", 9199)
}