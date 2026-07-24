'use client';

import { useState } from 'react';
import { PreviewTable } from './PreviewTable';
import type { ImportPreview } from '../types/ImportPreview';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ImportConfirmationErrorResponse, ImportConfirmationResponse } from '../types/ImportConfirmation';

interface Props {
  /** Optional callback when upload succeeds */
  onSuccess?: () => void;
  operations?: Array<{ id: string; name: string; status: string }>;
  industries?: Array<{ id: string; name: string }>;
}

export default function ImportCard({ onSuccess, operations = [], industries = [] }: Props = {}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState<ImportConfirmationResponse | null>(null);
  const [operationId, setOperationId] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [spreadsheetType, setSpreadsheetType] = useState('');
  const [renderedAt] = useState(() => Date.now());

  const [syncMode, setSyncMode] = useState<'FULL_SYNC' | 'ADD_ONLY'>('FULL_SYNC');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'NOVO' | 'ALTERADO' | 'REMOVIDO' | 'CONFLITO' | 'AMBIGUO'>('ALL');

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    const file = e.dataTransfer.files[0];
    await handleFile(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    // Reset input to allow same file re-selection
    e.target.value = '';
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      setError('Tipo de arquivo não suportado. Por favor, envie um arquivo .csv, .xls ou .xlsx.');
      return;
    }

    setFile(file);
    setLoading(true);
    setError(null);
    setPreview(null);
    setConfirmation(null);
    setAnalysis(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          const base64 = base64String.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/imports/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64,
          fileType: file.type,
        }),
      });

      const data = await response.json() as ImportPreview | { success: false; error?: string };

      if (!response.ok || !data.success) {
        throw new Error('error' in data && data.error ? data.error : 'Não foi possível processar o arquivo.');
      }

      setPreview(data);
      setLoading(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro durante o upload');
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setConfirmation(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!preview?.previewToken || analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/imports/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewToken: preview.previewToken,
          month: Number(month),
          year: Number(year),
          syncMode
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao analisar planilha.');
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Erro durante a análise da planilha.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview?.previewToken || confirming || confirmation) return;
    setConfirming(true);
    setError(null);
    try {
      const response = await fetch('/api/imports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewToken: preview.previewToken,
          idempotencyKey: crypto.randomUUID(),
          operationId: undefined,
          industryId: industryId || undefined,
          month: month ? Number(month) : undefined,
          year: year ? Number(year) : undefined,
          spreadsheetType: 'ROTEIRO_PROMOTORES',
          syncMode
        }),
      });
      const result = await response.json() as ImportConfirmationResponse | ImportConfirmationErrorResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.success ? 'Não foi possível confirmar a importação.' : result.error);
      }
      setConfirmation(result);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível confirmar a importação.');
    } finally {
      setConfirming(false);
    }
  };

  if (preview) {
    const expired = new Date(preview.expiresAt).getTime() <= renderedAt;
    const persistence = confirmation?.persistence;
    const isRouteWorkbook = preview.detectedType === 'ROTEIRO_PROMOTORES';

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="min-w-0 rounded-2xl border border-[#F4F4F5] p-5 bg-[#FAFAFA]">
          <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <h3 className="shrink-0 text-xs font-bold text-[#09090B] uppercase tracking-wider">Arquivo Carregado</h3>
            </div>
            <p className="min-w-0 truncate text-xs font-mono text-[#71717A]" title={file?.name || ''}>
              {file?.name || 'Nenhum arquivo selecionado'} — {preview.totalRows} linhas
            </p>
            <button
              onClick={handleRemoveFile}
              className="shrink-0 text-xs font-bold text-[#71717A] hover:text-[#EF4444] uppercase tracking-wider transition-colors"
            >
              Remover arquivo
            </button>
          </div>

          {isRouteWorkbook ? (
            <div className="space-y-5">
              {/* Etapa 2 & 3: Período e Modo */}
              <div className="grid gap-4 rounded-xl border border-[#E4E4E7] bg-white p-4 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-[#52525B]">Mês</span>
                  <select value={month} onChange={(event) => { setMonth(event.target.value); setAnalysis(null); }} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, i, 1))}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-[#52525B]">Ano</span>
                  <select value={year} onChange={(event) => { setYear(event.target.value); setAnalysis(null); }} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                    {Array.from({ length: 5 }, (_, i) => {
                      const y = new Date().getFullYear() - 2 + i;
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-[#52525B]">Modo</span>
                  <select value={syncMode} onChange={(event) => { setSyncMode(event.target.value as any); setAnalysis(null); }} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                    <option value="FULL_SYNC">Atualizar roteiro completo</option>
                    <option value="ADD_ONLY">Apenas adicionar novos</option>
                  </select>
                </label>
              </div>

              {!analysis && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="rounded-xl bg-[#20201F] text-white px-6 py-2.5 text-xs font-bold hover:bg-black transition-all"
                  >
                    {analyzing ? 'Analisando Planilha...' : 'Analisar Planilha'}
                  </button>
                </div>
              )}

              {/* Etapa 4: Resultados da Análise */}
              {analysis && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Indicadores */}
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      ['Linhas lidas', analysis.linesRead],
                      ['Válidas', analysis.linesValid],
                      ['Rotas novas', analysis.routesNew],
                      ['Rotas alteradas', analysis.routesUpdated],
                      ['Rotas mantidas', analysis.routesKept],
                      ['Rotas removidas', analysis.routesRemoved],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-[#E4E4E7] bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">{label}</p>
                        <p className="mt-1 text-sm font-extrabold text-[#18181B]">{value}</p>
                      </div>
                    ))}
                  </div>

                  {analysis.conflitos > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-sm">
                      <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Alerta de Conflitos Detectados</p>
                      <p className="mt-1">Foram identificados {analysis.conflitos} conflitos onde o mesmo promotor está alocado em indústrias/lojas diferentes no mesmo dia.</p>
                    </div>
                  )}

                  {/* Filtros */}
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-[#F4F4F5] pb-2">
                    {[
                      ['ALL', 'Todos'],
                      ['NOVO', 'Novos'],
                      ['ALTERADO', 'Alterados'],
                      ['REMOVIDO_DA_PLANILHA', 'Removidos'],
                      ['CONFLITO', 'Conflitos'],
                      ['AMBIGUO', 'Ambíguos'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key as any)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${filter === key ? 'bg-[#20201F] text-white' : 'bg-white text-[#71717A] border border-[#E4E4E7] hover:bg-[#FAFAFA]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tabela de Preview */}
                  <div className="max-h-96 overflow-auto rounded-2xl border border-[#E4E4E7] bg-white shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-[#FAFAFA] border-b font-bold text-[#52525B]">
                        <tr>
                          <th className="p-3 border-r">Aba</th>
                          <th className="p-3 border-r text-center">Linha</th>
                          <th className="p-3 border-r">Indústria</th>
                          <th className="p-3 border-r">Loja</th>
                          <th className="p-3 border-r text-center">UF</th>
                          <th className="p-3 border-r">Promotor</th>
                          <th className="p-3 border-r text-center">Dia</th>
                          <th className="p-3 border-r">Situação</th>
                          <th className="p-3">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.items
                          .filter((item: any) => filter === 'ALL' || item.status === filter || (filter === 'REMOVIDO' && item.status === 'REMOVIDO_DA_PLANILHA'))
                          .map((item: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-[#FAFAFA] transition-colors">
                              <td className="p-3 border-r font-mono text-[10px] text-[#71717A]">{item.aba}</td>
                              <td className="p-3 border-r text-center font-mono text-[#71717A]">{item.sourceRow || '-'}</td>
                              <td className="p-3 border-r font-bold text-[#18181B]">{item.industry}</td>
                              <td className="p-3 border-r text-[#3F3F46]">{item.store}</td>
                              <td className="p-3 border-r text-center font-mono font-bold text-[#71717A]">{item.uf}</td>
                              <td className="p-3 border-r font-bold text-[#18181B]">{item.promoter}</td>
                              <td className="p-3 border-r text-center font-semibold">{item.weekday}</td>
                              <td className="p-3 border-r">
                                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.status === 'SEM_ALTERACAO' ? 'bg-green-50 text-green-700 border border-green-200' : item.status === 'NOVO' ? 'bg-blue-50 text-blue-700 border border-blue-200' : item.status === 'ALTERADO' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                  {item.status === 'REMOVIDO_DA_PLANILHA' ? 'Removido' : item.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.action === 'CREATE' ? 'text-blue-700' : item.action === 'DELETE' ? 'text-red-700' : item.action === 'UPDATE' ? 'text-amber-700' : 'text-green-700'}`}>
                                  {item.action}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Etapa 5: Confirmação */}
                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-green-900 uppercase tracking-wider">Confirmar Sincronização</h4>
                    <p className="mt-1 text-xs text-green-800 font-semibold">
                      Ao clicar no botão abaixo, o sistema executará as seguintes alterações no roteiro de {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1, 1))}:
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs text-green-950 font-bold">
                      <div className="flex items-center gap-2">✓ Criar {analysis.routesNew} novas visitas</div>
                      <div className="flex items-center gap-2">✓ Atualizar {analysis.routesUpdated} visitas</div>
                      <div className="flex items-center gap-2">✓ Remover {analysis.routesRemoved} visitas planejadas obsoletas</div>
                      <div className="flex items-center gap-2">✓ Preservar {analysis.realizedPreserved} visitas já realizadas</div>
                    </div>

                    {confirmation ? (
                      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 border-t border-green-200/50 pt-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-800"><CheckCircle2 className="w-5 h-5 text-green-700" /> Sincronização concluída com sucesso!</span>
                        <Link href="/dashboard" className="sm:ml-auto rounded-xl bg-[#20201F] text-white px-5 py-2 text-xs font-bold hover:bg-black shadow-sm transition-all uppercase tracking-wider">Ver roteiros</Link>
                      </div>
                    ) : (
                      <div className="mt-5 flex justify-end border-t border-green-200/50 pt-4">
                        <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={confirming}
                          className="rounded-xl bg-green-700 text-white px-6 py-2.5 text-xs font-extrabold hover:bg-green-800 shadow-sm transition-all uppercase tracking-wider"
                        >
                          {confirming ? 'Atualizando Roteiro...' : 'ATUALIZAR ROTEIRO'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {[
                  ['Arquivo', preview.file.name],
                  ['Linhas', preview.totalRows],
                  ['Válidas', preview.validRows],
                  ['Inválidas', preview.invalidRows],
                  ['Visitas', preview.totalVisitsDetected],
                  ['Dias analisados', preview.dateColumnCount],
                  ['Lojas com visitas', preview.rowsWithVisits],
                ].map(([label, value]) => <div key={label} className="rounded-lg border border-[#E4E4E7] bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">{label}</p><p className="mt-1 truncate text-sm font-bold text-[#18181B]" title={String(value)}>{value}</p></div>)}
              </div>
              {preview.warnings.length > 0 && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p className="font-semibold">Avisos do arquivo</p><ul className="mt-1 list-disc space-y-1 pl-4">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
              <PreviewTable columns={preview.columns} data={preview.sample} />
              <div className="mt-5 rounded-xl border border-[#E4E4E7] bg-white p-4">
                {confirmation ? <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-800"><CheckCircle2 className="h-4 w-4" />Importação confirmada com sucesso.</div>
                  {persistence && <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <span>Lojas: {persistence.createdStores} criadas, {persistence.updatedStores} atualizadas</span>
                    <span>Indústrias: {persistence.createdIndustries} criadas, {persistence.updatedIndustries} atualizadas</span>
                    <span>Promotores: {persistence.createdPromoters} criados, {persistence.updatedPromoters} atualizados</span>
                    <span>Visitas: {persistence.createdVisits} criadas, {persistence.updatedVisits} atualizadas</span>
                    <span>Duplicidades ignoradas: {persistence.ignoredDuplicates}</span>
                    <span>Linhas inválidas ignoradas: {persistence.ignoredInvalidRows}</span>
                  </div>}
                  <Link href="/dashboard" className="inline-flex rounded-md bg-[#20201F] px-3 py-2 text-xs font-semibold text-white">Ver dashboard</Link>
                </div> : <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <label className="space-y-1">
                      <span className="block text-xs font-semibold text-[#52525B]">Indústria (opcional)</span>
                      <select value={industryId} onChange={(event) => setIndustryId(event.target.value)} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                        <option value="">Todas</option>
                        {industries.map((ind) => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-semibold text-[#52525B]">Mês</span>
                      <select value={month} onChange={(event) => setMonth(event.target.value)} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, i, 1))}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-semibold text-[#52525B]">Ano</span>
                      <select value={year} onChange={(event) => setYear(event.target.value)} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                        {Array.from({ length: 5 }, (_, i) => {
                          const y = new Date().getFullYear() - 2 + i;
                          return <option key={y} value={y}>{y}</option>;
                        })}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-semibold text-[#52525B]">Tipo de planilha</span>
                      <select value={spreadsheetType} onChange={(event) => setSpreadsheetType(event.target.value)} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs">
                        <option value="">Auto-detectar</option>
                        <option value="ROTEIRO_PROMOTORES">Roteiro</option>
                        <option value="CHECKLIST_INDUSTRIA">Checklist</option>
                        <option value="VISITAS">Visitas</option>
                        <option value="EVIDENCIAS">Evidências</option>
                        <option value="CONCILIACAO">Conciliação</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F4F4F5]">
                    <p className="text-xs text-[#52525B]">Serão persistidas somente {preview.validRows} linhas válidas e únicas.</p>
                    <button type="button" onClick={handleConfirm} disabled={!preview.previewToken || expired || preview.validRows === 0 || confirming} className="rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{confirming ? 'Confirmando...' : expired ? 'Preview expirado' : 'Confirmar importação'}</button>
                  </div>
                </div>}
              </div>
            </>
          )}

          {error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="cursor-pointer rounded-xl border border-dashed border-[#E4E4E7] p-8 text-center hover:border-[#A1A1AA] transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <div onClick={() => {
        const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
        if (input) {
          input.click();
        }
      }}>
        {loading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E4E4E7] border-b-[#16A34A]"></div>
            <p className="text-xs font-semibold text-[#71717A]">Enviando arquivo...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-2">
            <AlertCircle className="h-6 w-6 text-[#EF4444]" />
            <p className="text-xs font-semibold text-[#EF4444]">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <UploadCloud className="h-8 w-8 text-[#A1A1AA]" />
            <p className="text-xs font-semibold text-[#3F3F46]">
              Arraste e solte um arquivo CSV ou XLSX aqui<br />
              <span className="text-[10px] text-[#A1A1AA] font-normal">ou clique para selecionar do computador</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
