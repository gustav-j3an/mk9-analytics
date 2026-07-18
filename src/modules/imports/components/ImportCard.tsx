'use client';
import { useState } from 'react';

interface Props {
  /** Optional callback when upload succeeds */
  onSuccess?: () => void;
}

export default function ImportCard({ onSuccess }: Props = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.currentTarget) {
      (e.currentTarget as HTMLElement).classList.add('dragover');
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    if (e.currentTarget) {
      (e.currentTarget as HTMLElement).classList.remove('dragover');
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    if (e.currentTarget) {
      (e.currentTarget as HTMLElement).classList.remove('dragover');
    }

    // Check if dataTransfer exists and has files
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
    // Optional: validate file type
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Por favor, envie um arquivo .csv ou .xlsx.');
      return;
    }

    setFile(file);
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove data URL prefix if present (e.g., "data:text/csv;base64,")
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante o upload');
    } finally {
      setLoading(false);
      setFile(null); // Clear file state to allow re-upload of same file
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400 dragover:border-blue-500 dragover:bg-blue-50">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <div onClick={() => (document.querySelector('input[type=\"file\"]') as HTMLInputElement | null)?.click()}>
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600">Enviando arquivo...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center space-y-4">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-600">Arquivo enviado com sucesso!</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-4">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-4m0 0l4-4m-4 4h18" />
            </svg>
            <p className="text-sm text-gray-600">
              Arraste e solte um arquivo CSV ou XLSX aqui<br />
              <span className="text-xs text-gray-500">ou clique para selecionar</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}