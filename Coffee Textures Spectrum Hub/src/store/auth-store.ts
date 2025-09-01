import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@devvai/devv-code-backend';

interface User {
  uid: string;
  email: string;
  name: string;
  profile_picture?: string;
  phone?: string;
  preferences: {
    intensity?: number;
    roast_levels?: string[];
    allergies?: string[];
  };
  shipping_addresses: ShippingAddress[];
  subscription_status: 'none' | 'active' | 'paused' | 'cancelled';
  total_orders: number;
  email_verified: 'verified' | 'pending' | 'failed';
  created_at: string;
  last_login: string;
}

interface ShippingAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

interface AuthState {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth methods
  sendVerificationCode: (email: string) => Promise<void>;
  verifyAndLogin: (email: string, verificationCode: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // User profile methods
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addShippingAddress: (address: Omit<ShippingAddress, 'id'>) => Promise<void>;
  updateShippingAddress: (id: string, updates: Partial<ShippingAddress>) => Promise<void>;
  removeShippingAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  
  // Helper methods
  getUserData: (email: string, authUser: any) => Promise<User>;
  saveUserData: (user: User) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Authentication methods
      sendVerificationCode: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          await auth.sendOTP(email);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyAndLogin: async (email: string, verificationCode: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Verify OTP and get session
          const authResponse = await auth.verifyOTP(email, verificationCode);
          
          // Try to get existing user data or create new user
          const userData = await get().getUserData(email, authResponse.user);
          
          set({ 
            user: userData, 
            isAuthenticated: true,
            error: null
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          set({ error: errorMessage, user: null, isAuthenticated: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await auth.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        }
      },

      // Profile management
      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) throw new Error('No authenticated user');

        try {
          set({ isLoading: true, error: null });
          
          const updatedUser = { ...user, ...updates };
          
          // Update user in database
          await get().saveUserData(updatedUser);
          
          set({ user: updatedUser });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      addShippingAddress: async (address: Omit<ShippingAddress, 'id'>) => {
        const { user } = get();
        if (!user) throw new Error('No authenticated user');

        const newAddress: ShippingAddress = {
          ...address,
          id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // If this is the first address or marked as default, make it default
        if (user.shipping_addresses.length === 0 || address.is_default) {
          user.shipping_addresses.forEach(addr => addr.is_default = false);
        }

        const updatedUser = {
          ...user,
          shipping_addresses: [...user.shipping_addresses, newAddress]
        };

        await get().updateProfile(updatedUser);
      },

      updateShippingAddress: async (id: string, updates: Partial<ShippingAddress>) => {
        const { user } = get();
        if (!user) throw new Error('No authenticated user');

        const updatedAddresses = user.shipping_addresses.map(addr => 
          addr.id === id ? { ...addr, ...updates } : addr
        );

        // If setting as default, unset others
        if (updates.is_default) {
          updatedAddresses.forEach(addr => {
            if (addr.id !== id) addr.is_default = false;
          });
        }

        const updatedUser = {
          ...user,
          shipping_addresses: updatedAddresses
        };

        await get().updateProfile(updatedUser);
      },

      removeShippingAddress: async (id: string) => {
        const { user } = get();
        if (!user) throw new Error('No authenticated user');

        const addressToRemove = user.shipping_addresses.find(addr => addr.id === id);
        const remainingAddresses = user.shipping_addresses.filter(addr => addr.id !== id);

        // If removing default address and others exist, make first one default
        if (addressToRemove?.is_default && remainingAddresses.length > 0) {
          remainingAddresses[0].is_default = true;
        }

        const updatedUser = {
          ...user,
          shipping_addresses: remainingAddresses
        };

        await get().updateProfile(updatedUser);
      },

      setDefaultAddress: async (id: string) => {
        await get().updateShippingAddress(id, { is_default: true });
      },

      // Helper methods (not exposed in interface)
      getUserData: async (email: string, authUser: any): Promise<User> => {
        try {
          // Try to fetch existing user data
          const { table } = await import('@devvai/devv-code-backend');
          const response = await table.getItems('evn0fugm9g5c', {
            query: { email: email },
            limit: 1
          });

          if (response.items.length > 0) {
            const userData = response.items[0];
            return {
              uid: userData._uid,
              email: userData.email,
              name: userData.name,
              profile_picture: userData.profile_picture,
              phone: userData.phone,
              preferences: userData.preferences ? JSON.parse(userData.preferences) : {},
              shipping_addresses: userData.shipping_addresses ? JSON.parse(userData.shipping_addresses) : [],
              subscription_status: userData.subscription_status || 'none',
              total_orders: userData.total_orders || 0,
              email_verified: userData.email_verified || 'pending',
              created_at: userData.created_at,
              last_login: new Date().toISOString()
            };
          } else {
            // Create new user
            const newUser: User = {
              uid: authUser.uid,
              email: email,
              name: authUser.name || '',
              preferences: {},
              shipping_addresses: [],
              subscription_status: 'none',
              total_orders: 0,
              email_verified: 'verified',
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            };

            await get().saveUserData(newUser);
            return newUser;
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          throw error;
        }
      },

      saveUserData: async (user: User) => {
        try {
          const { table } = await import('@devvai/devv-code-backend');
          
          // Prepare data for storage
          const userData = {
            email: user.email,
            name: user.name,
            profile_picture: user.profile_picture,
            phone: user.phone,
            preferences: JSON.stringify(user.preferences),
            shipping_addresses: JSON.stringify(user.shipping_addresses),
            subscription_status: user.subscription_status,
            total_orders: user.total_orders,
            email_verified: user.email_verified,
            created_at: user.created_at,
            last_login: user.last_login
          };

          // Try to update existing user first
          try {
            await table.updateItem('evn0fugm9g5c', {
              _uid: user.uid,
              _id: user.uid, // Use uid as the item ID for users
              ...userData
            });
          } catch (updateError) {
            // If update fails, try to add new user
            await table.addItem('evn0fugm9g5c', userData);
          }
        } catch (error) {
          console.error('Error saving user data:', error);
          throw error;
        }
      },

      // Utility methods
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Type exports
export type { User, ShippingAddress };