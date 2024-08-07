import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app, firestore, auth;

try {
    console.log('Initializing Firebase with config:', firebaseConfig);
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

export { auth, firestore };
export default app;
// const firebaseConfig = {
//   apiKey: "AIzaSyBJ59QLCoSGJ7tbLxmDgwZxMgF1w3QncsQ",
//   authDomain: "inventory-management-df9b3.firebaseapp.com",
//   projectId: "inventory-management-df9b3",
//   storageBucket: "inventory-management-df9b3.appspot.com",
//   messagingSenderId: "736128033167",
//   appId: "1:736128033167:web:a9c46a9fe6f69b6eb7ebfa",
//   measurementId: "G-GBW0PEKV62"
// };
