import { initializeFirebase } from './firebase';

// Example configurations for different Firebase projects
export const firebaseConfigs = {
    // Production database
    production: {
        apiKey: "your_production_api_key",
        authDomain: "your-production-project.firebaseapp.com",
        projectId: "your-production-project",
        storageBucket: "your-production-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "your_production_app_id",
        measurementId: "your_production_measurement_id",
        appName: "production"
    },

    // Development database
    development: {
        apiKey: "your_development_api_key",
        authDomain: "your-dev-project.firebaseapp.com",
        projectId: "your-dev-project",
        storageBucket: "your-dev-project.appspot.com",
        messagingSenderId: "987654321",
        appId: "your_development_app_id",
        measurementId: "your_development_measurement_id",
        appName: "development"
    },

    // Testing database
    testing: {
        apiKey: "your_testing_api_key",
        authDomain: "your-test-project.firebaseapp.com",
        projectId: "your-test-project",
        storageBucket: "your-test-project.appspot.com",
        messagingSenderId: "555666777",
        appId: "your_testing_app_id",
        measurementId: "your_testing_measurement_id",
        appName: "testing"
    }
};

// Function to get Firebase instance based on environment
export const getFirebaseInstance = (environment: 'production' | 'development' | 'testing' = 'development') => {
    const config = firebaseConfigs[environment];
    if (!config) {
        throw new Error(`Unknown environment: ${environment}`);
    }

    return initializeFirebase(config);
};

// Function to get Firebase instance based on project ID
export const getFirebaseByProjectId = (projectId: string) => {
    const config = Object.values(firebaseConfigs).find(config => config.projectId === projectId);
    if (!config) {
        throw new Error(`No configuration found for project ID: ${projectId}`);
    }

    return initializeFirebase(config);
};

// Usage examples:
/*
// Initialize with specific environment
const { db: prodDb, auth: prodAuth } = getFirebaseInstance('production');
const { db: devDb, auth: devAuth } = getFirebaseInstance('development');

// Initialize with custom configuration
const customConfig = {
    apiKey: "your_custom_api_key",
    authDomain: "your-custom-project.firebaseapp.com",
    projectId: "your-custom-project",
    storageBucket: "your-custom-project.appspot.com",
    messagingSenderId: "111222333",
    appId: "your_custom_app_id",
    measurementId: "your_custom_measurement_id",
    appName: "custom"
};

const { db: customDb, auth: customAuth } = initializeFirebase(customConfig);
*/ 