import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Function to verify environment variables
const verifyEnvVariables = () => {
    const requiredEnvVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID',
        'VITE_FIREBASE_MEASUREMENT_ID'
    ];

    const missingVars = requiredEnvVars.filter(
        varName => !import.meta.env[varName]
    );

    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars);
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // console.log('All Firebase environment variables are loaded successfully:', {
    //     apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.slice(0, 5) + '...',
    //     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    //     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    //     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    //     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    //     appId: import.meta.env.VITE_FIREBASE_APP_ID?.slice(0, 5) + '...',
    //     measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    // });
};

// Function to create Firebase configuration
const createFirebaseConfig = (config?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
}) => {
    return {
        apiKey: config?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: config?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: config?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: config?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: config?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: config?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: config?.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };
};

// Function to initialize Firebase with custom configuration
export const initializeFirebase = (config?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
    appName?: string;
}) => {
    const firebaseConfig = createFirebaseConfig(config);
    const appName = config?.appName || '[DEFAULT]';

    const app = initializeApp(firebaseConfig, appName);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    console.log(`Firebase initialized successfully for project: ${firebaseConfig.projectId}`);

    return { app, auth, db, storage };
};

let app;
let auth;
let db;
let storage;

try {
    // Verify environment variables before initializing Firebase
    verifyEnvVariables();

    const firebaseConfig = createFirebaseConfig();

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');

    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    console.log('Firebase Auth initialized successfully');

    // Initialize Cloud Firestore and get a reference to the service
    db = getFirestore(app);
    console.log('Firestore initialized successfully');

    // Initialize Cloud Storage and get a reference to the service
    storage = getStorage(app);
    console.log('Storage initialized successfully');

} catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error; // Re-throw the error to prevent the app from running with invalid configuration
}

export { auth, db, storage }; 