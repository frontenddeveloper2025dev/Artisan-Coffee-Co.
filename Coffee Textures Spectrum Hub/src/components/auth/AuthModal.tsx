import React, { useState } from 'react';
import { X, Mail, Shield, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: 'email' | 'otp';
}

export function AuthModal({ isOpen, onClose, initialStep = 'email' }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'otp'>(initialStep);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { sendVerificationCode, verifyAndLogin, error, clearError } = useAuthStore();
  const { toast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      clearError();
      await sendVerificationCode(email);
      setStep('otp');
      toast({
        title: "Verification code sent!",
        description: `Check your email at ${email} for the verification code.`,
      });
    } catch (error) {
      toast({
        title: "Failed to send code",
        description: "Please check your email address and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    try {
      setIsSubmitting(true);
      clearError();
      await verifyAndLogin(email, verificationCode);
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please check your verification code and try again.",
        variant: "destructive",
      });
      setVerificationCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setVerificationCode('');
    setIsSubmitting(false);
    clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode('');
    clearError();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-md rounded-2xl shadow-2xl border border-roast-light/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-roast-dark to-roast-medium p-6 text-cream relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-cream/80 hover:text-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cream/20 rounded-full flex items-center justify-center">
              <Coffee className="w-5 h-5 text-cream" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to Artisan Coffee</h2>
              <p className="text-cream/80 text-sm">
                {step === 'email' ? 'Sign in to manage your subscription' : 'Enter your verification code'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'email' ? (
            <div key="email">
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-roast-dark mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-roast-medium w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-white border-roast-light/30 focus:border-roast-medium"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-roast-medium hover:bg-roast-dark text-cream"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-roast-medium">
                <p>We'll send you a secure verification code</p>
                <p className="text-xs text-roast-light mt-1">No password required • Quick & secure</p>
              </div>
            </div>
          ) : (
            <div key="otp">
              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-roast-dark mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-roast-medium w-4 h-4" />
                    <Input
                      id="code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="pl-10 bg-white border-roast-light/30 focus:border-roast-medium text-center text-lg tracking-wider"
                      maxLength={6}
                      required
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-roast-medium mt-1">
                    Code sent to {email}
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-roast-medium hover:bg-roast-dark text-cream"
                    disabled={isSubmitting || verificationCode.length !== 6}
                  >
                    {isSubmitting ? 'Verifying...' : 'Sign In'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToEmail}
                    className="w-full text-roast-medium hover:text-roast-dark hover:bg-roast-light/10"
                    disabled={isSubmitting}
                  >
                    ← Back to Email
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-roast-medium">
                <p>Didn't receive the code?</p>
                <button
                  onClick={handleBackToEmail}
                  className="text-roast-dark hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  Try a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}