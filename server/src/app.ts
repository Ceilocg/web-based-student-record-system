import express, { Application } from 'express';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import firebaseAdminConfig, { storageBucket } from './firebaseConfig';

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(firebaseAdminConfig),
  storageBucket,
});

// Firebase Storage bucket
export const bucket = getStorage().bucket();

// Initialize Express
const app: Application = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));


export default app;
