import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD3T0TA9GSt-zVjeG5_l0qOM0vy5uido84",
  authDomain: "wastewise-cc5ee.firebaseapp.com",
  projectId: "wastewise-cc5ee",
  storageBucket: "wastewise-cc5ee.firebasestorage.app",
  messagingSenderId: "1005452209652",
  appId: "1:1005452209652:web:44d6b00353d78f02975da1",
  measurementId: "G-DCP893EYSQ"
};

const FIREBASE_APP = initializeApp(firebaseConfig);
const FIRESTORE_DB = getFirestore(FIREBASE_APP);
const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const FIREBASE_STORAGE = getStorage(FIREBASE_APP);

export { 
  FIREBASE_APP, 
  FIREBASE_AUTH, 
  FIRESTORE_DB, 
  FIREBASE_STORAGE,
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  setDoc, 
  doc, 
  getDoc, 
  query, 
  where 
};

