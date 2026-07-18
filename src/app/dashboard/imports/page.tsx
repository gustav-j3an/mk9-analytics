import { prisma } from '@/lib/prisma';
import ImportCard from '@/modules/imports/components/ImportCard';

export default async function ImportsPage() {
  const imports = await prisma.import.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      _count: {
        select: { files: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Importar Dados</h1>
      <ImportCard />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Últimas importações</h2>
        {imports.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {imports.map(imp => (
              <li key={imp.id} className="py-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {imp._count.files} arquivo{imp._count.files !== 1 ? 's' : ''} • {new Date(imp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${ 
                    imp.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    imp.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    imp.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {imp.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">Nenhuma importação recente</p>
        )}
      </div>
    </div>
  );
}