import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    User,
    onAuthStateChanged,
    updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";

export interface AuthError {
    code: string;
    message: string;
}

export const login = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw handleAuthError(error as AuthError);
    }
};

export const register = async (
    email: string,
    password: string,
    name: string
): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        // Update the user's display name using the correct method
        await updateProfile(userCredential.user, { displayName: name });
        return userCredential.user;
    } catch (error) {
        throw handleAuthError(error as AuthError);
    }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw handleAuthError(error as AuthError);
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        throw handleAuthError(error as AuthError);
    }
};

export const subscribeToAuthChanges = (
    callback: (user: User | null) => void
): () => void => {
    return onAuthStateChanged(auth, callback);
};

// Helper function to handle Firebase auth errors
const handleAuthError = (error: AuthError): Error => {
    let message = "An error occurred during authentication.";

    switch (error.code) {
        case "auth/invalid-email":
            message = "Invalid email address.";
            break;
        case "auth/user-disabled":
            message = "This account has been disabled.";
            break;
        case "auth/user-not-found":
            message = "No account found with this email.";
            break;
        case "auth/wrong-password":
            message = "Incorrect password.";
            break;
        case "auth/email-already-in-use":
            message = "This email is already registered.";
            break;
        case "auth/weak-password":
            message = "Password should be at least 6 characters.";
            break;
        case "auth/network-request-failed":
            message = "Network error. Please check your connection.";
            break;
    }

    return new Error(message);
}; 