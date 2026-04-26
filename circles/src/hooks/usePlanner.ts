import { useState, useEffect } from 'react';
import { getPlans, getPlan, getUpcomingPlans } from '../services/plan.service';
import { Plan } from '../types/plan.types';

/**
 * Hook for fetching plans for a circle
 */
export const usePlans = (circleId: string | null, status?: 'upcoming' | 'past') => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!circleId) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const fetchPlans = async () => {
      try {
        setLoading(true);

        const result = await getPlans(circleId, status);

        if (result.success && result.plans) {
          setPlans(result.plans);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchPlans();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPlans, 30000);

    return () => clearInterval(interval);
  }, [circleId, status]);

  return { plans, loading, error };
};

/**
 * Hook for fetching a single plan
 */
export const usePlan = (circleId: string | null, planId: string | null) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!circleId || !planId) {
      setPlan(null);
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        setLoading(true);

        const result = await getPlan(circleId, planId);

        if (result.success && result.plan) {
          setPlan(result.plan);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchPlan();

    // Refresh every 10 seconds
    const interval = setInterval(fetchPlan, 10000);

    return () => clearInterval(interval);
  }, [circleId, planId]);

  return { plan, loading, error };
};

/**
 * Hook for fetching upcoming plans across all circles
 */
export const useUpcomingPlans = (circleIds: string[]) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (circleIds.length === 0) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const fetchPlans = async () => {
      try {
        setLoading(true);

        const result = await getUpcomingPlans(circleIds);

        if (result.success && result.plans) {
          setPlans(result.plans);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchPlans();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPlans, 30000);

    return () => clearInterval(interval);
  }, [circleIds.join(',')]);

  return { plans, loading, error };
};

/**
 * Hook for filtering plans by date range
 */
export const usePlansByDateRange = (
  circleId: string | null,
  startDate: Date,
  endDate: Date
) => {
  const { plans, loading, error } = usePlans(circleId);

  const filteredPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    return planDate >= startDate && planDate <= endDate;
  });

  return { plans: filteredPlans, loading, error };
};

/**
 * Hook for getting today's plans
 */
export const useTodaysPlans = (circleIds: string[]) => {
  const { plans, loading, error } = useUpcomingPlans(circleIds);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    return planDate >= today && planDate < tomorrow;
  });

  return { plans: todaysPlans, loading, error };
};

/**
 * Hook for getting this week's plans
 */
export const useThisWeeksPlans = (circleIds: string[]) => {
  const { plans, loading, error } = useUpcomingPlans(circleIds);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const thisWeeksPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    return planDate >= today && planDate < nextWeek;
  });

  return { plans: thisWeeksPlans, loading, error };
};
