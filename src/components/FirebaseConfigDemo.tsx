import React, { useState } from 'react';
import { getFirebaseInstance, initializeFirebase } from '../config/firebaseMultiConfig';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const FirebaseConfigDemo: React.FC = () => {
    const [currentConfig, setCurrentConfig] = useState<string>('default');
    const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');

    const handleConnectToEnvironment = async (environment: 'production' | 'development' | 'testing') => {
        try {
            setConnectionStatus('Connecting...');
            
            // Initialize Firebase with specific environment
            const { db, auth } = getFirebaseInstance(environment);
            
            // Test the connection by trying to read from Firestore
            const testDoc = await db.collection('test').doc('connection-test').get();
            
            setConnectionStatus(`Connected to ${environment} database successfully!`);
            setCurrentConfig(environment);
            
            console.log(`Connected to ${environment} Firebase project:`, db.app.options.projectId);
            
        } catch (error) {
            setConnectionStatus(`Failed to connect to ${environment}: ${error}`);
            console.error('Connection error:', error);
        }
    };

    const handleConnectToCustomConfig = async () => {
        try {
            setConnectionStatus('Connecting to custom config...');
            
            // Example custom configuration
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
            
            const { db, auth } = initializeFirebase(customConfig);
            
            setConnectionStatus('Connected to custom database successfully!');
            setCurrentConfig('custom');
            
            console.log('Connected to custom Firebase project:', db.app.options.projectId);
            
        } catch (error) {
            setConnectionStatus(`Failed to connect to custom config: ${error}`);
            console.error('Custom connection error:', error);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Firebase Configuration Demo</CardTitle>
                    <CardDescription>
                        Test connecting to different Firebase Firestore databases
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Current Configuration:</label>
                        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                            {currentConfig}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Connection Status:</label>
                        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                            {connectionStatus}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Connect to Environment</h3>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => handleConnectToEnvironment('development')}
                                variant="outline"
                            >
                                Development
                            </Button>
                            <Button 
                                onClick={() => handleConnectToEnvironment('testing')}
                                variant="outline"
                            >
                                Testing
                            </Button>
                            <Button 
                                onClick={() => handleConnectToEnvironment('production')}
                                variant="outline"
                            >
                                Production
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Custom Configuration</h3>
                        <Button 
                            onClick={handleConnectToCustomConfig}
                            variant="secondary"
                        >
                            Connect to Custom Database
                        </Button>
                        <p className="text-sm text-gray-500">
                            This will connect to a custom Firebase configuration defined in the code.
                        </p>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">How to Use:</h4>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Update the configuration in <code>src/config/firebaseMultiConfig.ts</code></li>
                            <li>Replace placeholder values with your actual Firebase project credentials</li>
                            <li>Use <code>getFirebaseInstance('environment')</code> to connect to specific environments</li>
                            <li>Use <code>initializeFirebase(customConfig)</code> for custom configurations</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FirebaseConfigDemo; 