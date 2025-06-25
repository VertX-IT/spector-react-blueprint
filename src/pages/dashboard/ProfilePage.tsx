import React, { useState, useRef } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { LogOut, Database, CreditCard, Lock, Camera, Upload, X, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Progress } from '@/components/ui/progress';
import { uploadProfilePicture, validateImageFile, compressImageProgressive, deleteProfilePicture } from '@/lib/profileOperations';
import { BackButton } from '@/components/ui/back-button';


// Define the profile form schema
const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Define the password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const ProfilePage: React.FC = () => {
  const { userData, logOut, currentUser, changePassword, updateUserData } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localProfilePicture, setLocalProfilePicture] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editDialogFileInputRef = useRef<HTMLInputElement>(null);

  // Setup form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userData?.displayName || '',
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || '',
    },
  });

  // Setup password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle profile picture upload from main page with progress tracking
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      // Show compression feedback
      toast({
        title: "Processing image",
        description: "Compressing and optimizing your image...",
      });

      // Use progressive compression for better results
      const compressedFile = await compressImageProgressive(file);

      // Show upload feedback
      toast({
        title: "Uploading",
        description: "Uploading to cloud storage...",
      });

      // Upload to Firebase with progress tracking
      const downloadURL = await uploadProfilePicture(
        compressedFile, 
        currentUser.uid,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Update user data in context
      await updateUserData({
        profilePictureURL: downloadURL,
        profilePictureUpdatedAt: new Date().toISOString(),
      });

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been uploaded successfully",
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle profile picture upload from edit dialog with immediate preview and progress
  const handleEditDialogImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      // Create immediate local preview
      const localURL = URL.createObjectURL(file);
      setLocalProfilePicture(localURL);

      // Show immediate feedback
      toast({
        title: "Image selected",
        description: "Processing and uploading...",
      });

      // Use progressive compression for better results
      const compressedFile = await compressImageProgressive(file);
      
      // Upload to Firebase in background with progress tracking
      uploadProfilePicture(
        compressedFile, 
        currentUser.uid,
        (progress) => {
          setUploadProgress(progress);
        }
      )
        .then(async (downloadURL) => {
          // Update user data in context
          await updateUserData({
            profilePictureURL: downloadURL,
            profilePictureUpdatedAt: new Date().toISOString(),
          });

          // Clear local preview and use Firebase URL
          setLocalProfilePicture(null);
          setUploadProgress(0);
          
          toast({
            title: "Profile picture uploaded",
            description: "Your profile picture has been saved to cloud storage",
          });
        })
        .catch((error) => {
          // Revert local preview on error
          setLocalProfilePicture(null);
          setUploadProgress(0);
          toast({
            title: "Upload failed",
            description: "Failed to upload to cloud storage. Please try again.",
            variant: "destructive",
          });
        });

    } catch (error: any) {
      toast({
        title: "Error processing image",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
    } finally {
      // Reset file input
      if (editDialogFileInputRef.current) {
        editDialogFileInputRef.current.value = '';
      }
    }
  };

  // Handle profile picture removal
  const handleRemoveProfilePicture = async () => {
    if (!currentUser) return;

    try {
      setIsRemoving(true);
      await deleteProfilePicture(currentUser.uid, userData?.profilePictureURL || undefined);
      
      // Update user data in context
      await updateUserData({
        profilePictureURL: null,
        profilePictureUpdatedAt: new Date().toISOString(),
      });

      // Clear local preview
      setLocalProfilePicture(null);

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      });

    } catch (error: any) {
      toast({
        title: "Removal failed",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle profile picture click
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  // Handle edit dialog profile picture click
  const handleEditDialogProfilePictureClick = () => {
    editDialogFileInputRef.current?.click();
  };

  // Reset local preview when dialog closes
  const handleEditDialogClose = () => {
    setLocalProfilePicture(null);
    setIsEditDialogOpen(false);
  };
  

  // Handle profile update
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateUserData({
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
      });
      handleEditDialogClose();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      console.error("Password change error:", error);
      // Error handling is done in the auth context
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

  // Get current profile picture URL (local or Firebase)
  const getCurrentProfilePicture = () => {
    return localProfilePicture || userData?.profilePictureURL || "";
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="mb-4 px-1">
        <div className="mb-3">
          <BackButton 
            to="/dashboard"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        
        <h1 className="text-xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information and preferences

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
            {/* Hidden file input for main page */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
            
            {/* Profile Picture */}
            <div className="relative group">
              <Avatar 
                className="h-24 w-24 cursor-pointer transition-all duration-200 group-hover:opacity-80"
                onClick={handleProfilePictureClick}
              >
                <AvatarImage 
                  src={getCurrentProfilePicture()} 
                  alt={userData?.displayName || "User"} 
                />
                <AvatarFallback className="text-3xl">
                  {userData?.displayName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/50 rounded-full p-2">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Loading indicator */}
              {(isUploading || isRemoving) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            
            {/* Profile Picture Actions */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProfilePictureClick}
                  disabled={isUploading || isRemoving}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
                
                {userData?.profilePictureURL && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveProfilePicture}
                    disabled={isUploading || isRemoving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {isRemoving ? "Removing..." : "Remove"}
                  </Button>
                )}
              </div>
              
              {/* Progress bar for upload */}
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(uploadProgress)}% uploaded
                  </p>
                </div>
              )}
            </div>
            

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
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Danger Zone</p>
              <Button variant="destructive" className="w-full">Delete Account</Button>
            </div>
          </CardContent>
        </Card>


      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and profile picture
            </DialogDescription>
          </DialogHeader>
          
          {/* Hidden file input for edit dialog */}
          <input
            ref={editDialogFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleEditDialogImageUpload}
            className="hidden"
          />
          
          {/* Profile Picture Section in Dialog */}
          <div className="flex flex-col items-center gap-4 py-4 border-b">
            <div className="relative group">
              <Avatar 
                className="h-20 w-20 cursor-pointer transition-all duration-200 group-hover:opacity-80"
                onClick={handleEditDialogProfilePictureClick}
              >
                <AvatarImage 
                  src={getCurrentProfilePicture()} 
                  alt={userData?.displayName || "User"} 
                />
                <AvatarFallback className="text-2xl">
                  {userData?.displayName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/50 rounded-full p-2">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditDialogProfilePictureClick}

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
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Change Photo
                  </>
                )}
              </Button>
              
              {/* Progress bar for upload */}
              {isUploading && uploadProgress > 0 && (
                <div className="mt-2 space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(uploadProgress)}% uploaded
                  </p>
                </div>
              )}
              
              {localProfilePicture && !isUploading && (
                <p className="text-xs text-muted-foreground mt-1">
                  Image selected, uploading to cloud storage...
                </p>
              )}
            </div>

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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="+1 (123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleEditDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Change Password</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
