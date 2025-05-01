
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const ProfilePage: React.FC = () => {
  const { userData } = useAuth();
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={userData?.displayName || "User"} />
              <AvatarFallback className="text-3xl">{userData?.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <p className="text-xl font-semibold">{userData?.displayName}</p>
              <p className="text-muted-foreground">{userData?.email}</p>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {userData?.role}
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground w-full max-w-xs">
              <div className="flex justify-between py-2 border-b">
                <span>Phone Number</span>
                <span className="font-medium text-foreground">{userData?.phoneNumber || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Member Since</span>
                <span className="font-medium text-foreground">
                  {userData?.createdAt 
                    ? new Intl.DateTimeFormat('en-US').format(new Date(userData.createdAt)) 
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline">Edit Profile</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your password and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed: Never
              </p>
              <Button variant="outline" className="w-full">Change Password</Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Danger Zone</p>
              <Button variant="destructive" className="w-full">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProfilePage;
