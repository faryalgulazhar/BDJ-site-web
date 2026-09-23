"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import SplashScreen from "@/components/SplashScreen";
import type { PrivateUserProfile, PublicUserProfile } from "@/types/user";

// Fallback admin emails used until the first `isAdmin: true` is manually set
// in Firestore Console for the bootstrap admin.
export const ADMIN_EMAIL = "admin@bdj.com";
export const ADMIN_EMAILS = ["admin@bdj.com", "admin@bdj-karukera.com"];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onboardingComplete: boolean;
  userProfile: PrivateUserProfile | null;
  publicProfile: PublicUserProfile | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<PrivateUserProfile | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicUserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setTimeout(() => setShowSplash(false), 550);

      if (!firebaseUser) {
        setUserProfile(null);
        setPublicProfile(null);
        setProfileLoading(false);
        return;
      }

      // Subscribe to the private user doc (owner can always read their own)
      setProfileLoading(true);
      const privateRef = doc(db, "users", firebaseUser.uid);
      const publicRef = doc(db, "users", firebaseUser.uid, "public", "profile");

      let unsubPrivate: (() => void) | undefined;
      let unsubPublic: (() => void) | undefined;

      unsubPrivate = onSnapshot(privateRef, (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as PrivateUserProfile);
        } else {
          setUserProfile(null);
        }
        setProfileLoading(false);
      });

      unsubPublic = onSnapshot(publicRef, (snap) => {
        if (snap.exists()) {
          setPublicProfile(snap.data() as PublicUserProfile);
        } else {
          setPublicProfile(null);
        }
      });

      return () => {
        unsubPrivate?.();
        unsubPublic?.();
      };
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      setPublicProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // isAdmin: Firestore flag takes priority; email fallback covers the bootstrap period
  const isEmailAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const isAdmin = userProfile?.isAdmin === true || isEmailAdmin;
  const isSuperAdmin = userProfile?.superAdmin === true || isEmailAdmin;
  const onboardingComplete = userProfile?.onboardingComplete === true || isEmailAdmin;

  const value: AuthContextType = {
    user,
    loading,
    profileLoading,
    isAdmin,
    isSuperAdmin,
    onboardingComplete,
    userProfile,
    publicProfile,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {showSplash && <SplashScreen visible={loading} />}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
