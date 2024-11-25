import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9CL6PbNMhB0dLakwaLW5Fr_lH1ikyiSM",
  authDomain: "capstone-2-5c8e9.firebaseapp.com",
  projectId: "capstone-2-5c8e9",
  storageBucket: "capstone-2-5c8e9.appspot.com",
  messagingSenderId: "165462163713",
  appId: "1:165462163713:web:4f26817bde580651dddb00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

const storage  = getStorage(app);



export { db, auth, storage };
