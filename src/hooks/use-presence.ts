
"use client";

import { useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * A custom hook to manage user's online presence in Firestore.
 * It updates the user's status to 'online' when they are active
 * and 'offline' when they disconnect.
 */
export const usePresence = () => {
  const [user] = useAuthState(auth);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      return;
    }

    const userStatusRef = doc(db, 'users', user.uid);

    const updateStatus = (status: 'online' | 'offline') => {
      return updateDoc(userStatusRef, {
        status: status,
        lastSeen: serverTimestamp() as Timestamp,
      });
    };

    // Set online status immediately and start a heartbeat
    updateStatus('online');
    heartbeatIntervalRef.current = setInterval(() => {
      // Update lastSeen periodically to show the user is still active
      updateDoc(userStatusRef, { lastSeen: serverTimestamp() as Timestamp });
    }, 30000); // 30-second heartbeat

    const handleBeforeUnload = () => {
      // This is a synchronous call to try and update status before the tab closes.
      // Note: This is not guaranteed to execute, especially on mobile browsers.
      updateStatus('offline');
    };

    // Listen for page close events
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup on unmount or user change
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      // Set status to offline when the component unmounts (e.g., user logs out)
      updateStatus('offline');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);
};

