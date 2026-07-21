'use client';

import { useState } from 'react';
import { PreviewTable } from './PreviewTable';
import type { ImportPreview } from '../types/ImportPreview';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  /** Optional callback when upload succeeds */
  onSuccess?: () => void;
}

export default function ImportCard({ onSuccess }: Props = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

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
  };

  if (preview) {
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
          <p className="mb-4 text-xs font-semibold text-[#3F3F46]">
            Total de visitas detectadas no arquivo: {preview.totalVisitsDetected}
          </p>
          <PreviewTable columns={preview.columns} data={preview.sample} />
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
