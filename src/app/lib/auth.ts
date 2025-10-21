import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

// Create a new account
export async function signUp(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email, password);
}

// Login existing user
export async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

// Logout
export async function logOut() {
  await signOut(auth);
}

// Listen to user changes
export function onUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
