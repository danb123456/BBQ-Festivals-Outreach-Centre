import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Error signing in', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized in your Firebase console. Please add the current URL to your Firebase Authorized Domains.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Ignore this one as it's common
      } else {
        alert(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </FirebaseContext.Provider>
  );
}
