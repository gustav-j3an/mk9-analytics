import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
export default function NotFound() { return <main className="error-page"><div className="error-code">404</div><FileQuestion /><h1>Página não encontrada</h1><p>O endereço informado não existe ou foi movido.</p><Link href="/dashboard" className="standard-button">Voltar ao dashboard</Link></main>; }