import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDuHiguCmfJQg1fYbH0myeg2ZieOf-m6ws",
  authDomain: "video-demo-creation.firebaseapp.com",
  projectId: "video-demo-creation",
  storageBucket: "video-demo-creation.firebasestorage.app",
  messagingSenderId: "855230926501",
  appId: "1:855230926501:web:548f46c3fb4d9a1999474c",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
