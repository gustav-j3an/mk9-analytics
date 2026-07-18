import { operationService } from '@/modules/operations/services/OperationService';

export default async function DashboardPage() {
  let dashboardData;
  let error = null;

  try {
    dashboardData = await operationService.getDashboardData();
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err);
    error = 'Failed to load dashboard data';
    // Provide empty data to avoid breaking the UI
    dashboardData = {
      currentOperation: null,
      promoters: 0,
      stores: 0,
      industries: 0,
      plannedVisits: 0,
      realizedVisits: 0,
      pendencies: 0,
      coverage: 0,
      frequency: 0,
      conflicts: 0,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Current Operation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Operação Atual</h2>
        {dashboardData.currentOperation ? (
          <div className="space-y-2">
            <p><strong>Nome:</strong> {dashboardData.currentOperation.name}</p>
            <p><strong>Mês/Ano:</strong> {String(dashboardData.currentOperation.month).padStart(2, '0')}/{dashboardData.currentOperation.year}</p>
            <p><strong>Status:</strong> 
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${dashboardData.currentOperation.status === 'PLANNING' ? 'bg-blue-100 text-blue-800' :
                  dashboardData.currentOperation.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                  dashboardData.currentOperation.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                  dashboardData.currentOperation.status === 'FINISHED' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-gray-100 text-gray-800'}`}>
                {dashboardData.currentOperation.status}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma operação ativa encontrada</p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Promoters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Promotores</h3>
          <p className="text-3xl font-bold text-blue-600">{dashboardData.promoters}</p>
        </div>

        {/* Stores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Lojas</h3>
          <p className="text-3xl font-bold text-green-600">{dashboardData.stores}</p>
        </div>

        {/* Industries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Indústrias</h3>
          <p className="text-3xl font-bold text-purple-600">{dashboardData.industries}</p>
        </div>

        {/* Conflicts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Conflitos</h3>
          <p className="text-3xl font-bold text-red-600">{dashboardData.conflicts}</p>
        </div>
      </div>

      {/* Visit Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Planned Visits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Visitas Planejadas</h3>
          <p className="text-3xl font-bold text-blue-600">{dashboardData.plannedVisits}</p>
        </div>

        {/* Realized Visits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Visitas Realizadas</h3>
          <p className="text-3xl font-bold text-green-600">{dashboardData.realizedVisits}</p>
        </div>

        {/* Pendencies */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Pendências</h3>
          <p className="text-3xl font-bold text-orange-600">{dashboardData.pendencies}</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Coverage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Cobertura</h3>
          <p className="text-3xl font-bold text-teal-600">{dashboardData.coverage}%</p>
        </div>

        {/* Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Frequência (visitas/promotor)</h3>
          <p className="text-3xl font-bold text-indigo-600">{dashboardData.frequency}</p>
        </div>

        {/* Empty space for balance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Última Atualização</h3>
          <p className="text-3xl font-bold text-gray-600">{new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}