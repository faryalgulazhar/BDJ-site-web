export interface PrivateUserProfile {
  uid: string;
  email: string;
  legalName: string;        // attendance only — never shown publicly
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
