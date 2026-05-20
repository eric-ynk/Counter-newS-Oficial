// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfI3rDcKDacaYwJm3RmBSAH9loTcCnFvY",
  authDomain: "counter-news.firebaseapp.com",
  projectId: "counter-news",
  storageBucket: "counter-news.firebasestorage.app",
  messagingSenderId: "440874943411",
  appId: "1:440874943411:web:579173b1db842fb4e0c1c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);