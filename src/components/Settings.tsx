
import React, { useState } from 'react';
import { Moon, Sun, Bell, Shield, Palette, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    // TODO: Implement settings save to Firebase/localStorage
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application preferences and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-600">Switch between light and dark themes</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications in your browser</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Shield className="w-5 h-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => toast({ title: "Feature Coming Soon", description: "Password change functionality will be available soon." })}
            >
              Change Password
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => toast({ title: "Feature Coming Soon", description: "Two-factor authentication will be available soon." })}
            >
              Enable Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Database className="w-5 h-5 mr-2" />
              Data Management
            </CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => toast({ title: "Export Started", description: "Your data export will be ready shortly." })}
            >
              Export Data
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => toast({ title: "Feature Coming Soon", description: "Account deletion will require admin approval." })}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          className="h-12 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
