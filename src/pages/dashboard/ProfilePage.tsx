
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Database, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Define the form schema
const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage: React.FC = () => {
  const { userData, logOut, currentUser } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Setup form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userData?.displayName || '',
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || '',
    },
  });
  
  // Handle profile update
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // In a real app, you would update the user profile in Firebase here
      // For now, we'll just show a success message
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/signin');
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit Profile</Button>
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
        
        {/* Storage Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>Your current database storage usage</CardDescription>
            </div>
            <Database className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database storage</span>
                  <span className="text-sm font-medium">20MB / 100MB</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-[20%] rounded-full bg-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File storage</span>
                  <span className="text-sm font-medium">150MB / 500MB</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-[30%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Need more storage? Upgrade your plan to increase your storage limits.</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Pricing Plans Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Pricing Plans</span>
            </CardTitle>
            <CardDescription>
              Upgrade your plan to unlock more features
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="standard">Standard</TabsTrigger>
                <TabsTrigger value="premium">Premium</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Basic Plan</h4>
                  <Badge>Current</Badge>
                </div>
                <p className="text-xl font-bold">$0 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-center text-sm">✓ 100MB Database Storage</li>
                  <li className="flex items-center text-sm">✓ 500MB File Storage</li>
                  <li className="flex items-center text-sm">✓ 100 form responses/month</li>
                  <li className="flex items-center text-sm">✓ Basic Analytics</li>
                </ul>
              </TabsContent>
              <TabsContent value="standard" className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Standard Plan</h4>
                </div>
                <p className="text-xl font-bold">$9.99 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-center text-sm">✓ 1GB Database Storage</li>
                  <li className="flex items-center text-sm">✓ 5GB File Storage</li>
                  <li className="flex items-center text-sm">✓ 1,000 form responses/month</li>
                  <li className="flex items-center text-sm">✓ Advanced Analytics</li>
                  <li className="flex items-center text-sm">✓ Custom Branding</li>
                </ul>
                <Button className="w-full mt-4">Upgrade to Standard</Button>
              </TabsContent>
              <TabsContent value="premium" className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Premium Plan</h4>
                </div>
                <p className="text-xl font-bold">$29.99 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-center text-sm">✓ 10GB Database Storage</li>
                  <li className="flex items-center text-sm">✓ 50GB File Storage</li>
                  <li className="flex items-center text-sm">✓ Unlimited form responses</li>
                  <li className="flex items-center text-sm">✓ Premium Analytics</li>
                  <li className="flex items-center text-sm">✓ Custom Branding</li>
                  <li className="flex items-center text-sm">✓ Priority Support</li>
                </ul>
                <Button className="w-full mt-4">Upgrade to Premium</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Logout Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              <span>Session</span>
            </CardTitle>
            <CardDescription>
              Manage your current session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm">Last Login</span>
                <span className="text-sm font-medium">Today at 09:30 AM</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm">Session Type</span>
                <span className="text-sm font-medium">Web Browser</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePage;
