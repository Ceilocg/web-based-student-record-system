import { ServiceAccount } from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Firebase Admin SDK credentials
const firebaseAdminConfig: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
};

export const storageBucket = process.env.FIREBASE_STORAGE_BUCKET; // Your Firebase Storage bucket
export default firebaseAdminConfig;
