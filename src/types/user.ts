export interface PrivateUserProfile {
  uid: string;
  email: string;
  legalName: string;        // attendance only — never shown publicly
  isAdmin: boolean;         // written by Cloud Function / console only
  superAdmin: boolean;      // console-only, never app-writable
  onboardingComplete: boolean;
  role?: string;
  memberId?: string;
  activityPoints?: number;
  cardTheme?: string;
  createdAt?: any;
  // Settings-related
  usernameChanges?: any[];
  lastPasswordReset?: any;
}

export interface PublicUserProfile {
  username: string;         // public-facing display name
  photoURL?: string | null;
}
