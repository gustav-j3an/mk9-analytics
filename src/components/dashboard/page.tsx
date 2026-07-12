import { StatsCard } from "./stats-card";
import { Calendar, ClipboardList, CheckCircle2, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Visão Geral</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Operação Atual"
                    value="Junho 2026"
                    icon={Calendar}
                />
                <StatsCard
                    title="Visitas Planejadas"
                    value="0"
                    icon={ClipboardList}
                />
                <StatsCard
                    title="Visitas Realizadas"
                    value="0"
                    icon={CheckCircle2}
                />
                <StatsCard
                    title="Percentual de Execução"
                    value="0%"
                    icon={TrendingUp}
                />
            </div>
        </div>
    );
}