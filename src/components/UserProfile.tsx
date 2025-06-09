
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const UserProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [userInfo, setUserInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@vetqure.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345',
    role: 'Financial Manager'
  });

  const [editedInfo, setEditedInfo] = useState(userInfo);

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Implement Firebase user update
    setTimeout(() => {
      setUserInfo(editedInfo);
      setIsEditing(false);
      setIsLoading(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    }, 1000);
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">User Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <Card className="max-w-2xl bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">{userInfo.name}</CardTitle>
                <CardDescription className="text-gray-600">{userInfo.role}</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={editedInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-12"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{userInfo.name}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email Address
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{userInfo.email}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editedInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="h-12"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{userInfo.phone}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{userInfo.role}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Address
            </label>
            {isEditing ? (
              <Input
                value={editedInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="h-12"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{userInfo.address}</div>
            )}
          </div>

          {isEditing && (
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 h-12"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
