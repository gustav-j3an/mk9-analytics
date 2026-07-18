import { useEffect, useState } from 'react';

interface Visit {
  id: string;
  operationId: string;
  operation: {
    id: string;
    name: string;
    month: number;
    year: number;
    status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
    startsAt: string;
    endsAt: string;
    createdAt: string;
    updatedAt: string;
  };
  promoterId: string;
  promoter: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  storeId: string;
  store: {
    id: string;
    name: string;
    code: string;
    chain?: string | null;
    city?: string | null;
    state?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  industryId: string;
  industry: {
    id: string;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  status: 'PLANEJADA' | 'REALIZADA' | 'CANCELADA';
  scheduledDate: string;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Metrics {
  totalVisits: number;
  visitsByStatus: Record<string, number>;
  realizedPercentage: number;
}

interface ApiResponse {
  visits: Visit[];
  metrics: Metrics;
}

interface OperationOption {
  value: string;
  label: string;
}

interface Props {
  operationOptions?: OperationOption[];
}

export default function DashboardOverview({ operationOptions }: Props = {}) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalVisits: 0,
    visitsByStatus: {},
    realizedPercentage: 0,
  });
  const [filters, setFilters] = useState<{
    operationId: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    operationId: null,
    startDate: null,
    endDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (filters.operationId) params.append('operationId', filters.operationId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const res = await fetch(`/api/analytics?${params.toString()}`);
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

        const data: ApiResponse = await res.json();
        if (cancelled) return;
        setVisits(data.visits);
        setMetrics(data.metrics);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(err.message ?? 'Erro desconhecido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filters.operationId, filters.startDate, filters.endDate]);

  const handleFilterChange = (
    field: keyof typeof filters,
    value: string | null
  ) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <p className='text-center py-4'>Carregando...</p>;
  if (error) return <p className='text-center text-red-500 p-4'>{error}</p>;

  return (
    <section className='space-y-6 p-4'>
      {/* Header with filters */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='w-full sm:w-auto'>
          <label className='block text-sm font-medium mb-1'>Operação</label>
          <select
            value={filters.operationId ?? ''}
            onChange={e => handleFilterChange('operationId', e.target.value || null)}
            className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
          >
            <option value=''>Todas</option>
            {operationOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className='flex-1 flex flex-col sm:flex-row gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Data inicial</label>
            <input
              type='date'
              value={filters.startDate ?? ''}
              onChange={e => handleFilterChange('startDate', e.target.value || null)}
              className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Data final</label>
            <input
              type='date'
              value={filters.endDate ?? ''}
              onChange={e => handleFilterChange('endDate', e.target.value || null)}
              className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
        </div>
      </div>

      {/* Metrics cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <h3 className='text-sm font-medium text-gray-500'>Total de Visitas</h3>
          <p className='mt-1 text-2xl font-bold text-gray-900'>{metrics.totalVisits}</p>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <h3 className='text-sm font-medium text-gray-500'>Taxa de Realização</h3>
          <p className='mt-1 text-2xl font-bold text-gray-900'>
            {metrics.realizedPercentage.toFixed(1)}%
          </p>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <h3 className='text-sm font-medium text-gray-500'>
            Realizadas vs Planejadas
          </h3>
          <div className='mt-2 space-y-1 text-sm'>
            {Object.entries(metrics.visitsByStatus).map(([status, count]) => (
              <div key={status} className='flex justify-between'>
                <span className='capitalize'>{status}</span>
                <span className='font-medium'>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visits table */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Data</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Promotor</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Loja</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Indústria</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {visits.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center text-gray-500'>
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              visits.map(v => (
                <tr key={v.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {new Date(v.scheduledDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {v.promoter.name}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {v.store.name}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {v.industry.name}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm'>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        {
                          PLANEJADA: 'bg-yellow-100 text-yellow-800',
                          REALIZADA: 'bg-green-100 text-green-800',
                          CANCELADA: 'bg-red-100 text-red-800',
                        }[v.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}