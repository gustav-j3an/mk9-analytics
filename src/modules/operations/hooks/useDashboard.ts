import { useEffect, useState } from 'react';

/**
 * Type for dashboard data
 */
export interface DashboardData {
  currentOperation: {
    id: string;
    name: string;
    month: number;
    year: number;
    status: string;
  } | null;
  promoters: number;
  stores: number;
  industries: number;
  plannedVisits: number;
  realizedVisits: number;
  pendencies: number;
  coverage: number;
  frequency: number;
  conflicts: number;
}

/**
 * Hook to fetch dashboard data from the API
 * @returns Object containing data, loading state, and error
 */
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/dashboard');

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const result = await response.json();
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}