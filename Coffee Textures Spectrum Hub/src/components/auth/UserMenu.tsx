import React, { useState } from 'react';
import { User, Settings, Package, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  if (!isAuthenticated || !user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      onClick: () => {
        // TODO: Navigate to profile page
        toast({
          title: "Profile",
          description: "Profile management coming soon!",
        });
        setIsOpen(false);
      }
    },
    {
      icon: Package,
      label: 'My Orders',
      onClick: () => {
        // TODO: Navigate to orders page
        toast({
          title: "Orders",
          description: "Order history coming soon!",
        });
        setIsOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Preferences',
      onClick: () => {
        // TODO: Navigate to preferences page
        toast({
          title: "Preferences",
          description: "Coffee preferences coming soon!",
        });
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-cream"
      >
        <div className="w-8 h-8 bg-cream/20 rounded-full flex items-center justify-center">
          {user.profile_picture ? (
            <img 
              src={user.profile_picture} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-cream" />
          )}
        </div>
        <div className="text-left">
          <div className="font-medium text-sm">{user.name || 'Coffee Lover'}</div>
          <div className="text-xs text-cream/80">{user.email}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-roast-light/20 z-50 overflow-hidden">
            <div className="py-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-roast-dark hover:bg-roast-light/10 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-roast-medium" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
              
              <hr className="my-2 border-roast-light/20" />
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}