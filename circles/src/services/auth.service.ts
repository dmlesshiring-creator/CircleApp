import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, firestore, storage } from './firebase';

/**
 * Authentication Service
 * 
 * Handles user authentication and profile management
 */

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(firestore, `users/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      bio: '',
      createdAt: serverTimestamp(),
      subscription: 'free',
      onboardingCompleted: false,
    });

    console.log('User signed up:', user.uid);

    return { success: true };
  } catch (error: any) {
    console.error('Sign up error:', error);

    let errorMessage = 'Failed to create account';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);

    return { success: true };
  } catch (error: any) {
    console.error('Sign in error:', error);

    let errorMessage = 'Failed to sign in';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Sign out
 */
export const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await signOut(auth);
    console.log('User signed out');

    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: false, error: 'Failed to sign out' };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);

    let errorMessage = 'Failed to send reset email';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Update user display name
 */
export const updateDisplayName = async (
  displayName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Update Firebase Auth profile
    await updateProfile(user, { displayName });

    // Update Firestore document
    await updateDoc(doc(firestore, `users/${user.uid}`), {
      displayName,
      updatedAt: serverTimestamp(),
    });

    console.log('Display name updated');

    return { success: true };
  } catch (error: any) {
    console.error('Update display name error:', error);
    return { success: false, error: 'Failed to update display name' };
  }
};

/**
 * Update user bio
 */
export const updateBio = async (
  bio: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Update Firestore document
    await updateDoc(doc(firestore, `users/${user.uid}`), {
      bio,
      updatedAt: serverTimestamp(),
    });

    console.log('Bio updated');

    return { success: true };
  } catch (error: any) {
    console.error('Update bio error:', error);
    return { success: false, error: 'Failed to update bio' };
  }
};

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = async (
  uri: string
): Promise<{ success: boolean; photoURL?: string; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const photoURL = await getDownloadURL(storageRef);

    // Update Firebase Auth profile
    await updateProfile(user, { photoURL });

    // Update Firestore document
    await updateDoc(doc(firestore, `users/${user.uid}`), {
      photoURL,
      updatedAt: serverTimestamp(),
    });

    console.log('Profile photo uploaded');

    return { success: true, photoURL };
  } catch (error: any) {
    console.error('Upload profile photo error:', error);
    return { success: false, error: 'Failed to upload photo' };
  }
};

/**
 * Delete profile photo
 */
export const deleteProfilePhoto = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Delete from Firebase Storage
    const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      // Ignore if file doesn't exist
      console.log('Profile photo not found in storage');
    }

    // Update Firebase Auth profile
    await updateProfile(user, { photoURL: null });

    // Update Firestore document
    await updateDoc(doc(firestore, `users/${user.uid}`), {
      photoURL: null,
      updatedAt: serverTimestamp(),
    });

    console.log('Profile photo deleted');

    return { success: true };
  } catch (error: any) {
    console.error('Delete profile photo error:', error);
    return { success: false, error: 'Failed to delete photo' };
  }
};

/**
 * Update email address
 */
export const updateUserEmail = async (
  newEmail: string,
  currentPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update email
    await updateEmail(user, newEmail);

    // Update Firestore document
    await updateDoc(doc(firestore, `users/${user.uid}`), {
      email: newEmail,
      updatedAt: serverTimestamp(),
    });

    console.log('Email updated');

    return { success: true };
  } catch (error: any) {
    console.error('Update email error:', error);

    let errorMessage = 'Failed to update email';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Update password
 */
export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    console.log('Password updated');

    return { success: true };
  } catch (error: any) {
    console.error('Update password error:', error);

    let errorMessage = 'Failed to update password';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect current password';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete user document from Firestore
    await deleteDoc(doc(firestore, `users/${user.uid}`));

    // Delete profile photo from Storage
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await deleteObject(storageRef);
    } catch (error) {
      // Ignore if file doesn't exist
      console.log('Profile photo not found in storage');
    }

    // Delete user account
    await deleteUser(user);

    console.log('User account deleted');

    return { success: true };
  } catch (error: any) {
    console.error('Delete account error:', error);

    let errorMessage = 'Failed to delete account';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Get user profile data
 */
export const getUserProfile = async (
  uid: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const userDoc = await getDoc(doc(firestore, `users/${uid}`));

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: userDoc.data() };
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return { success: false, error: 'Failed to get user profile' };
  }
};

/**
 * Mark onboarding as completed
 */
export const completeOnboarding = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await updateDoc(doc(firestore, `users/${user.uid}`), {
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    });

    console.log('Onboarding completed');

    return { success: true };
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
};
