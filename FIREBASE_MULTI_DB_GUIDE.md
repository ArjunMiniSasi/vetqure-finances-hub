# Firebase Multi-Database Connection Guide

This guide explains how to connect to different Firebase Firestore databases in your project.

## Overview

Your project is currently configured to use a single Firebase project (`stock-and-source-management`). However, you can easily connect to different Firebase Firestore databases using several methods.

## Methods to Connect to Different Databases

### Method 1: Environment Variables (Simplest)

The easiest way is to change your environment variables. Create a `.env` file in your project root:

```bash
# .env
VITE_FIREBASE_API_KEY=your_new_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_new_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_new_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_new_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_new_sender_id
VITE_FIREBASE_APP_ID=your_new_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_new_measurement_id
```

**Steps:**
1. Get your Firebase project credentials from Firebase Console
2. Create a `.env` file with the new credentials
3. Restart your development server
4. The app will now connect to the new database

### Method 2: Multiple Firebase Configurations (Advanced)

I've enhanced your Firebase configuration to support multiple databases simultaneously.

#### Files Created/Modified:

1. **`src/config/firebase.ts`** - Enhanced with multi-config support
2. **`src/config/firebaseMultiConfig.ts`** - New file with multiple configurations
3. **`src/components/FirebaseConfigDemo.tsx`** - Demo component

#### Usage Examples:

```typescript
import { getFirebaseInstance, initializeFirebase } from './config/firebaseMultiConfig';

// Connect to specific environment
const { db: prodDb, auth: prodAuth } = getFirebaseInstance('production');
const { db: devDb, auth: devAuth } = getFirebaseInstance('development');

// Connect with custom configuration
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
```

### Method 3: Runtime Configuration Switching

You can also switch databases at runtime:

```typescript
import { initializeFirebase } from './config/firebase';

// Switch to different database based on user selection
const switchToDatabase = (projectId: string) => {
    const config = {
        apiKey: "your_api_key",
        authDomain: `${projectId}.firebaseapp.com`,
        projectId: projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: "123456789",
        appId: "your_app_id",
        measurementId: "your_measurement_id",
        appName: `db-${projectId}`
    };
    
    return initializeFirebase(config);
};
```

## Configuration Files

### 1. Update `src/config/firebaseMultiConfig.ts`

Replace the placeholder values with your actual Firebase project credentials:

```typescript
export const firebaseConfigs = {
    production: {
        apiKey: "your_actual_production_api_key",
        authDomain: "your-production-project.firebaseapp.com",
        projectId: "your-production-project",
        storageBucket: "your-production-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "your_actual_production_app_id",
        measurementId: "your_actual_production_measurement_id",
        appName: "production"
    },
    // ... other environments
};
```

### 2. Update `.firebaserc` (Optional)

If you want to use Firebase CLI with different projects:

```json
{
  "projects": {
    "default": "your-new-project-id",
    "production": "your-production-project-id",
    "development": "your-development-project-id"
  }
}
```

## Testing the Connection

### Using the Demo Component

1. Import and use the demo component:

```typescript
import FirebaseConfigDemo from './components/FirebaseConfigDemo';

// In your app
<FirebaseConfigDemo />
```

2. The demo will show connection status and allow testing different configurations.

### Manual Testing

```typescript
import { getFirebaseInstance } from './config/firebaseMultiConfig';

// Test connection
const testConnection = async () => {
    try {
        const { db } = getFirebaseInstance('development');
        const testDoc = await db.collection('test').doc('connection-test').get();
        console.log('Connection successful!');
    } catch (error) {
        console.error('Connection failed:', error);
    }
};
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Keep your Firebase API keys secure
3. **Firestore Rules**: Ensure proper security rules for each database
4. **Authentication**: Consider how authentication works across different databases

## Best Practices

1. **Environment Separation**: Use different databases for development, testing, and production
2. **Configuration Management**: Keep configurations in environment variables
3. **Error Handling**: Always handle connection errors gracefully
4. **Logging**: Log which database you're connecting to for debugging
5. **Testing**: Test connections before deploying

## Troubleshooting

### Common Issues:

1. **"Missing environment variables"**
   - Ensure all required environment variables are set
   - Check that variable names start with `VITE_`

2. **"Firebase app already initialized"**
   - Use different `appName` for each configuration
   - Or use the `initializeFirebase` function with unique names

3. **"Permission denied"**
   - Check Firestore security rules
   - Verify API keys and project permissions

4. **"Project not found"**
   - Verify project ID is correct
   - Ensure you have access to the Firebase project

## Next Steps

1. Update the configuration files with your actual Firebase credentials
2. Test the connection using the demo component
3. Integrate multi-database support into your existing components
4. Set up proper environment variables for different deployment environments

## Files to Update

- `src/config/firebaseMultiConfig.ts` - Add your actual Firebase credentials
- `.env` - Create with your new database credentials
- `.firebaserc` - Update with your project IDs (optional)
- Your components - Import and use the new Firebase instances as needed 