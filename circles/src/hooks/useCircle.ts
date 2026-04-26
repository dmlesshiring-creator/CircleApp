import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../services/firebase';
import { PrivateCircle } from '../types/circle.types';

/**
 * Hook for fetching a single circle
 */
export const useCircle = (circleId: string | null) => {
  const [circle, setCircle] = useState<PrivateCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!circleId) {
      setCircle(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(firestore, `circles/${circleId}`),
      (snapshot) => {
        if (snapshot.exists()) {
          setCircle({
            id: snapshot.id,
            ...snapshot.data(),
          } as PrivateCircle);
        } else {
          setCircle(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [circleId]);

  return { circle, loading, error };
};

/**
 * Hook for fetching user's circles
 */
export const useUserCircles = () => {
  const [circles, setCircles] = useState<PrivateCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const fetchCircles = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(firestore, 'circles'),
          where('members', 'array-contains', currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const circlesData: PrivateCircle[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PrivateCircle[];

        // Sort by last activity (most recent first)
        circlesData.sort((a, b) => {
          const aTime = a.lastActivityAt || a.createdAt || 0;
          const bTime = b.lastActivityAt || b.createdAt || 0;
          return bTime - aTime;
        });

        setCircles(circlesData);
        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchCircles();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCircles, 30000);

    return () => clearInterval(interval);
  }, []);

  return { circles, loading, error };
};

/**
 * Hook for checking if user is circle admin
 */
export const useIsCircleAdmin = (circleId: string | null): boolean => {
  const { circle } = useCircle(circleId);
  const currentUser = auth.currentUser;

  if (!circle || !currentUser) return false;

  return circle.creatorUid === currentUser.uid;
};

/**
 * Hook for checking if user is circle member
 */
export const useIsCircleMember = (circleId: string | null): boolean => {
  const { circle } = useCircle(circleId);
  const currentUser = auth.currentUser;

  if (!circle || !currentUser) return false;

  return circle.members.includes(currentUser.uid);
};

/**
 * Hook for getting circle member count
 */
export const useCircleMemberCount = (circleId: string | null): number => {
  const { circle } = useCircle(circleId);

  if (!circle) return 0;

  return circle.members.length;
};
