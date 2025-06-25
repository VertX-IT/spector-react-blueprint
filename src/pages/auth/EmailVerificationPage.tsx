import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/layout/AuthLayout';

export const EmailVerificationPage: React.FC = () => {
  const { sendVerificationEmail, isEmailVerified, reloadUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "Verification email sent",
        description: "Check your inbox for the verification link.",
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      await reloadUser();
      
      // Check if email is now verified
      if (isEmailVerified) {
        toast({
          title: "Email verified!",
          description: "Your email has been verified successfully.",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Email not verified yet",
          description: "Please check your email and click the verification link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email address"
      subtitle="We've sent a verification link to your email"
      showBackButton={true}
      backTo="/signin"
    >
      <div className="space-y-6">
        {/* Step-by-step instructions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-900">Follow these steps:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <div className="text-sm text-gray-700">
                <strong>Check your email</strong>
                <p className="text-gray-600 mt-1">Open your email inbox and look for a message from Spector</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div className="text-sm text-gray-700">
                <strong>Click the verification link</strong>
                <p className="text-gray-600 mt-1">Click the "Verify Email" button or link in the email</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div className="text-sm text-gray-700">
                <strong>Return to this page</strong>
                <p className="text-gray-600 mt-1">Come back here and click "Check Verification" below</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important note */}
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> After clicking the verification link in your email, 
            return to this page and click "Check Verification" to access your dashboard.
          </AlertDescription>
        </Alert>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCheckVerification}
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking verification...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Verification
              </>
            )}
          </Button>

          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend verification email
              </>
            )}
          </Button>
        </div>

        {/* Help section */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Need help?</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Check your spam or junk folder</p>
            <p>• Make sure you entered the correct email address</p>
            <p>• Wait a few minutes for the email to arrive</p>
            <p>• Try clicking "Resend verification email" above</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already verified?{' '}
            <Link to="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}; 