import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@/contexts/AuthContext';
import { Eye, EyeOff, CheckCircle, XCircle, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Password strength checker function
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  if (passedChecks <= 2) return { strength: 'weak', color: 'text-red-500', checks };
  if (passedChecks <= 3) return { strength: 'fair', color: 'text-yellow-500', checks };
  if (passedChecks <= 4) return { strength: 'good', color: 'text-blue-500', checks };
  return { strength: 'strong', color: 'text-green-500', checks };
};

// Custom password validation
const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/\d/, { message: "Password must contain at least one number" })
  .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" });

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Full name is required" }).min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }).min(10, { message: "Please enter a valid phone number" }),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  role: z.enum(['designer', 'collector'], { required_error: "Please select an account type" }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

// Custom hook for form persistence
const useFormPersistence = <T extends Record<string, any>>(
  formKey: string,
  defaultValues: T
) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data from localStorage
  const loadSavedData = (): T => {
    try {
      const saved = localStorage.getItem(`signup_form_${formKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore non-sensitive fields (exclude passwords)
        return {
          ...defaultValues,
          ...parsed,
          password: '', // Don't restore password for security
          confirmPassword: '', // Don't restore confirm password for security
        } as T;
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
    return defaultValues;
  };

  // Save data to localStorage
  const saveData = (data: T) => {
    try {
      // Don't save sensitive fields
      const { password, confirmPassword, ...safeData } = data;
      localStorage.setItem(`signup_form_${formKey}`, JSON.stringify(safeData));
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  };

  // Clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(`signup_form_${formKey}`);
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }
  };

  return {
    loadSavedData,
    saveData,
    clearSavedData,
    isLoaded,
    setIsLoaded,
  };
};

// Password Strength Indicator Component
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;
  
  const { strength, color, checks } = checkPasswordStrength(password);
  
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Password strength:</span>
        <span className={`text-sm font-semibold ${color}`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          {checks.length ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={checks.length ? "text-green-600" : "text-red-600"}>
            At least 8 characters
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {checks.uppercase ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={checks.uppercase ? "text-green-600" : "text-red-600"}>
            One uppercase letter
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {checks.lowercase ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={checks.lowercase ? "text-green-600" : "text-red-600"}>
            One lowercase letter
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {checks.number ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={checks.number ? "text-green-600" : "text-red-600"}>
            One number
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {checks.special ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={checks.special ? "text-green-600" : "text-red-600"}>
            One special character
          </span>
        </div>
      </div>
    </div>
  );
};

// Terms of Service Modal Component
const TermsOfServiceModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            Privacy Policy & User Terms for Spector
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Explicitly Agree Upon Account Creation
          </p>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Spector app, you agree to the following terms and conditions. 
                If you do not agree, please do not use the application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. Purpose of the App</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Spector is a data collection and storage tool designed for professionals to capture, 
                  organize, and access property inspection data.
                </li>
                <li>
                  The app does not interpret, process, validate, or verify the accuracy or completeness 
                  of any data entered by users. It serves purely as a recording and organizational platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. Information We Collect</h2>
              <p className="mb-2">Spector may collect and store the following data types:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Personal Information:</strong> Name, email address, phone number, and Google account identifiers
                </li>
                <li>
                  <strong>Survey and Field Data:</strong> Photos, GPS location, notes, timestamps, and inspection-related inputs.
                </li>
                <li>
                  <strong>Device Data:</strong> Non-identifying information such as device type, app version, and device ID for diagnostics and security.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. How Your Data Is Used</h2>
              <p className="mb-2">Data collected through Spector is used for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supporting core app functionality (data capture, syncing, export)</li>
                <li>Managing accounts and survey permissions</li>
                <li>Securing system integrity and fixing bugs</li>
                <li>Providing user support</li>
              </ul>
              <p className="mt-3">
                <strong>We do not sell, share, or monetize personal or survey data.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. User Consent</h2>
              <p className="mb-2">Spector requests access only when necessary for feature functionality:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Location Access:</strong> Used to tag entries with GPS.</li>
                <li><strong>Camera Access:</strong> Used to take photos for inspections.</li>
                <li><strong>Storage Access:</strong> Used for uploading attachments or exporting reports.</li>
              </ul>
              <p className="mt-3">These permissions are used strictly during active data collection.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Data Storage and Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All inspection data is stored securely in encrypted cloud storage.</li>
                <li>Data entered while offline is stored locally on the device and uploaded automatically when connectivity is restored.</li>
                <li>Access to cloud data is restricted based on user role and authentication.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Data Access and Control</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Survey Creators:</strong> Can access and export all data in their surveys.</li>
                <li><strong>Data Collectors:</strong> Can only view or export data they have personally submitted.</li>
                <li>Users may initiate account deletion or data deletion at any time.</li>
                <li>You have the right to request a copy of all data we have about you.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Liability and Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Spector is provided "as is" without warranties of any kind.</li>
                <li>Users are responsible for the accuracy and completeness of data they enter.</li>
                <li>We are not liable for any damages arising from the use of the application.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. Jurisdiction and Governing Law</h2>
              <p>
                These terms are governed by the laws of the jurisdiction where Spector operates. 
                Any disputes will be resolved in accordance with applicable local laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. Policy Updates</h2>
              <p>
                We may update these terms from time to time. Users will be notified of significant changes, 
                and continued use of the app constitutes acceptance of updated terms.
              </p>
            </section>
          </div>
        </ScrollArea>
        <div className="p-6 pt-0">
          <Button onClick={onClose} className="w-full">
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Privacy Policy Modal Component
const PrivacyPolicyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            Privacy Policy for Spector
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            How we collect, use, and protect your data
          </p>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
              <p className="mb-2">Spector may collect and store the following data types:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Personal Information:</strong> Name, email address, phone number, and Google account identifiers
                </li>
                <li>
                  <strong>Survey and Field Data:</strong> Photos, GPS location, notes, timestamps, and inspection-related inputs.
                </li>
                <li>
                  <strong>Device Data:</strong> Non-identifying information such as device type, app version, and device ID for diagnostics and security.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. How Your Data Is Used</h2>
              <p className="mb-2">Data collected through Spector is used for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supporting core app functionality (data capture, syncing, export)</li>
                <li>Managing accounts and survey permissions</li>
                <li>Securing system integrity and fixing bugs</li>
                <li>Providing user support</li>
              </ul>
              <p className="mt-3">
                <strong>We do not sell, share, or monetize personal or survey data.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. User Consent and Permissions</h2>
              <p className="mb-2">Spector requests access only when necessary for feature functionality:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Location Access:</strong> Used to tag entries with GPS coordinates for accurate asset location tracking.</li>
                <li><strong>Camera Access:</strong> Used to take photos for inspections and asset documentation.</li>
                <li><strong>Storage Access:</strong> Used for uploading attachments or exporting reports.</li>
              </ul>
              <p className="mt-3">These permissions are used strictly during active data collection and can be revoked at any time through your device settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. Data Storage and Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All inspection data is stored securely in encrypted cloud storage using Firebase services.</li>
                <li>Data entered while offline is stored locally on the device and uploaded automatically when connectivity is restored.</li>
                <li>Access to cloud data is restricted based on user role and authentication.</li>
                <li>We implement industry-standard security measures to protect your data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Data Access and Control</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Survey Creators:</strong> Can access and export all data in their surveys.</li>
                <li><strong>Data Collectors:</strong> Can only view or export data they have personally submitted.</li>
                <li>Users may initiate account deletion or data deletion at any time.</li>
                <li>You have the right to request a copy of all data we have about you.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Audit Metadata</h2>
              <p className="mb-2">To ensure traceability and accountability, each inspection record may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Created By (user ID)</li>
                <li>Created At (timestamp)</li>
                <li>Last Modified (timestamp)</li>
                <li>Location (if enabled)</li>
              </ul>
              <p className="mt-3">This information may appear in dashboards, logs, or exported reports for audit purposes.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account data is retained as long as your account is active.</li>
                <li>Survey data is retained according to your organization's requirements.</li>
                <li>You may request data deletion at any time.</li>
                <li>Some data may be retained for legal or security purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Third-Party Services</h2>
              <p className="mb-2">We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Firebase:</strong> For authentication, database, and storage services</li>
                <li><strong>Google Services:</strong> For Google Sign-In functionality</li>
              </ul>
              <p className="mt-3">These services have their own privacy policies and data handling practices.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. International Data Transfers</h2>
              <p>
                Your data may be processed and stored in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data during such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. Contact Information</h2>
              <p className="mb-2">For privacy-related questions or concerns, please contact us:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: privacy@spector-app.com</li>
                <li>We will respond to your inquiry within 30 days.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">11. Policy Updates</h2>
              <p>
                This privacy policy may be updated from time to time. We will notify users of significant changes 
                and provide an opportunity to review the updated policy before it takes effect.
              </p>
            </section>
          </div>
        </ScrollArea>
        <div className="p-6 pt-0">
          <Button onClick={onClose} className="w-full">
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SignUpForm: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const defaultValues: SignUpFormValues = {
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'collector',
    termsAccepted: false,
  };

  const { loadSavedData, saveData, clearSavedData, isLoaded, setIsLoaded } = useFormPersistence('signup', defaultValues);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: loadSavedData(),
  });

  const password = form.watch('password');

  // Load saved data on component mount
  useEffect(() => {
    if (!isLoaded) {
      const savedData = loadSavedData();
      form.reset(savedData as SignUpFormValues);
      setIsLoaded(true);
    }
  }, [isLoaded, form, loadSavedData, setIsLoaded]);

  // Save form data on every change
  useEffect(() => {
    if (isLoaded) {
      const subscription = form.watch((data) => {
        setIsSaving(true);
        saveData(data as SignUpFormValues);
        // Show saving indicator briefly
        setTimeout(() => setIsSaving(false), 500);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, saveData, isLoaded]);

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
      await signUp(
        values.email,
        values.password,
        values.name,
        values.phoneNumber,
        values.role as UserRole
      );
      // Clear saved data on successful signup
      clearSavedData();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in the AuthContext
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // For Google sign-up, we'll use 'collector' as default role
      // Users can change this later in their profile
      await signInWithGoogle('collector');
      // Clear saved data on successful Google signup
      clearSavedData();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      {isSaving && (
        <div className="text-xs text-muted-foreground text-center animate-pulse">
          Auto-saving your progress...
        </div>
      )}
      
      {/* Google Sign Up Button */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              Signing up with Google...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </div>
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
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
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="********" 
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <PasswordStrengthIndicator password={password} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="********" 
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Account Type *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="designer" />
                      </FormControl>
                      <FormLabel className="font-normal">Designer (Create and manage forms)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="collector" />
                      </FormControl>
                      <FormLabel className="font-normal">Collector (Fill forms and collect data)</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-primary hover:underline"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </button>{" "}
                    *
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => {
                form.reset(defaultValues);
                clearSavedData();
              }}
              className="text-muted-foreground hover:text-foreground underline"
            >
              Clear form
            </button>
            <span>
              Already have an account?{" "}
              <Link to="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </Form>

      {/* Modals */}
      <TermsOfServiceModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />
      <PrivacyPolicyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
    </div>
  );
};
