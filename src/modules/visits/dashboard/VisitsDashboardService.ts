import { VisitsDashboardRepository } from './VisitsDashboardRepository';
import type { VisitItem, VisitsSummaryData } from './visits-dashboard.types';

export class VisitsDashboardService {
  static async getDashboardData(filters: {
    promoter?: string;
    supervisor?: string;
    operation?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    industry?: string;
    store?: string;
  }): Promise<{
    visits: VisitItem[];
    summary: VisitsSummaryData;
    uniquePromoters: string[];
    uniqueSupervisors: string[];
    uniqueOperations: string[];
    uniqueIndustries: string[];
    uniqueStores: string[];
  }> {
    const rawVisits = await VisitsDashboardRepository.getVisitsList();

    const visits: VisitItem[] = rawVisits.map((v) => {
      const promoterName = v.promoter?.name || 'Não disponível';
      const supervisorName = v.promoter?.supervisor?.name || 'Não disponível';
      const operationName = v.operation?.name || 'Não disponível';
      const industryName = v.industry?.name || 'Não disponível';
      const storeName = v.store?.name || 'Não disponível';

      const fotoUrl = null;
      const checklistStatus = 'Não disponível';

      return {
        id: v.id,
        promoterName,
        supervisorName,
        operationName,
        industryName,
        storeName,
        scheduledDate: v.scheduledDate.toLocaleDateString('pt-BR'),
        completedDate: v.completedDate ? v.completedDate.toLocaleDateString('pt-BR') : null,
        status: v.status,
        fotoUrl,
        checklistStatus,
      };
    });

    const uniquePromoters = Array.from(new Set(visits.map((v) => v.promoterName))).sort();
    const uniqueSupervisors = Array.from(new Set(visits.map((v) => v.supervisorName))).sort();
    const uniqueOperations = Array.from(new Set(visits.map((v) => v.operationName).filter(x => x !== 'MK9 - OPERAÇÃO PADRÃO'))).sort();
    const uniqueIndustries = Array.from(new Set(visits.map((v) => v.industryName))).sort();
    const uniqueStores = Array.from(new Set(visits.map((v) => v.storeName))).sort();

    let filteredVisits = visits;
    const now = new Date();

    if (filters.promoter) {
      filteredVisits = filteredVisits.filter((v) => v.promoterName === filters.promoter);
    }
    if (filters.supervisor) {
      filteredVisits = filteredVisits.filter((v) => v.supervisorName === filters.supervisor);
    }
    if (filters.operation) {
      filteredVisits = filteredVisits.filter((v) => v.operationName === filters.operation);
    }
    if (filters.industry) {
      filteredVisits = filteredVisits.filter((v) => v.industryName === filters.industry);
    }
    if (filters.store) {
      filteredVisits = filteredVisits.filter((v) => v.storeName === filters.store);
    }
    if (filters.status) {
      filteredVisits = filteredVisits.filter((v) => v.status === filters.status);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filteredVisits = filteredVisits.filter((v) => {
        const [day, month, year] = v.scheduledDate.split('/');
        const visitDate = new Date(`${year}-${month}-${day}`);
        return visitDate >= start;
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      filteredVisits = filteredVisits.filter((v) => {
        const [day, month, year] = v.scheduledDate.split('/');
        const visitDate = new Date(`${year}-${month}-${day}`);
        return visitDate <= end;
      });
    }

    const totalPlanned = filteredVisits.length;
    const totalExecuted = filteredVisits.filter((v) => v.status === 'REALIZADA').length;
    const totalPending = filteredVisits.filter((v) => v.status === 'PLANEJADA').length;

    const totalOverdue = rawVisits.filter((rv) => {
      const match = filteredVisits.some((fv) => fv.id === rv.id);
      if (!match) return false;
      const isPending = rv.status === 'PLANEJADA';
      const isPast = new Date(rv.scheduledDate).getTime() < now.getTime();
      return isPending && isPast;
    }).length;

    const coverage = totalPlanned > 0 ? Math.round((totalExecuted / totalPlanned) * 100) : 0;

    const promoterMap = new Map<string, { planned: number; executed: number }>();
    for (const v of filteredVisits) {
      if (!promoterMap.has(v.promoterName)) {
        promoterMap.set(v.promoterName, { planned: 0, executed: 0 });
      }
      const pData = promoterMap.get(v.promoterName)!;
      pData.planned++;
      if (v.status === 'REALIZADA') pData.executed++;
    }
    const promoterCompletionRates = Array.from(promoterMap.entries())
      .map(([promoterName, stats]) => ({
        promoterName,
        rate: stats.planned > 0 ? Math.round((stats.executed / stats.planned) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate);

    const operationMap = new Map<string, { planned: number; executed: number }>();
    for (const v of filteredVisits) {
      if (!operationMap.has(v.operationName)) {
        operationMap.set(v.operationName, { planned: 0, executed: 0 });
      }
      const oData = operationMap.get(v.operationName)!;
      oData.planned++;
      if (v.status === 'REALIZADA') oData.executed++;
    }
    const operationCompletionRates = Array.from(operationMap.entries())
      .map(([operationName, stats]) => ({
        operationName,
        rate: stats.planned > 0 ? Math.round((stats.executed / stats.planned) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate);

    return {
      visits: filteredVisits,
      summary: {
        totalPlanned,
        totalExecuted,
        totalPending,
        totalOverdue,
        coverage,
        promoterCompletionRates,
        operationCompletionRates,
      },
      uniquePromoters,
      uniqueSupervisors,
      uniqueOperations,
      uniqueIndustries,
      uniqueStores,
    };
  }
}
