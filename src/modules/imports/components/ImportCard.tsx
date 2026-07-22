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
}

export default function ImportCard({ onSuccess, operations = [] }: Props = {}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState<ImportConfirmationResponse | null>(null);
  const [operationId, setOperationId] = useState('');

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
  };

  const handleConfirm = async () => {
    if (!preview?.previewToken || confirming || confirmation) return;
    if (preview.detectedType === 'ROTEIRO_PROMOTORES' && !operationId) {
      setError('Selecione uma operação para gerar as datas do roteiro semanal.');
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const response = await fetch('/api/imports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewToken: preview.previewToken, idempotencyKey: crypto.randomUUID(), operationId: operationId || undefined }),
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
    const expired = new Date(preview.expiresAt).getTime() <= Date.now();
    const persistence = confirmation?.persistence;
    return (
      <div className="space-y-6">
        <div className="min-w-0 rounded-xl border border-[#F4F4F5] p-4 bg-[#FAFAFA]">
          <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <h3 className="shrink-0 text-xs font-bold text-[#09090B] uppercase tracking-wider">Arquivo Processado</h3>
            </div>
            <p className="min-w-0 truncate text-xs font-mono text-[#71717A]" title={file?.name || ''}>
              {file?.name || 'Nenhum arquivo selecionado'} — {preview.totalRows} linhas ({preview.validRows} válidas, {preview.invalidRows} inválidas)
            </p>
            <button
              onClick={handleRemoveFile}
              className="shrink-0 text-xs font-bold text-[#71717A] hover:text-[#09090B] uppercase tracking-wider transition-colors"
            >
              Remover
            </button>
          </div>
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
            </div> : <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="min-w-[260px] space-y-1"><span className="block text-xs font-semibold text-[#52525B]">Operação (opcional)</span><select value={operationId} onChange={(event) => setOperationId(event.target.value)} className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white px-3 text-xs"><option value="">Sem operação vinculada</option>{operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.name} — {operation.status}</option>)}</select></label>
              <p className="text-xs text-[#52525B]">Serão persistidas somente {preview.validRows} linhas válidas e únicas.</p>
              <button type="button" onClick={handleConfirm} disabled={!preview.previewToken || expired || preview.validRows === 0 || confirming} className="rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{confirming ? 'Confirmando...' : expired ? 'Preview expirado' : 'Confirmar importação'}</button>
            </div>}
            {error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
          </div>
        </div>

        <div className="cursor-pointer rounded-xl border border-dashed border-[#E4E4E7] p-6 text-center hover:border-[#A1A1AA] transition-colors"
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
                <p className="text-xs font-semibold text-[#71717A]">Processando arquivo...</p>
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
                  <span className="text-[10px] text-[#A1A1AA] font-normal">ou clique para selecionar</span>
                </p>
              </div>
            )}
          </div>
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
