'use client';

import React, { useState } from 'react';
import { Bell, Check, ClipboardCheck, AlertTriangle, Upload } from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'import' | 'reconciliation' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
  linkLabel?: string;
}

export const NotificationFeed = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'import',
      title: 'Importação Concluída',
      description: 'Arquivo "visitas_sul_julho.csv" processado com 14 divergências detectadas.',
      time: 'Há 10 min',
      read: false,
      link: '/dashboard/conciliacao',
      linkLabel: 'Resolver conciliação',
    },
    {
      id: '2',
      type: 'reconciliation',
      title: 'Pendências Operacionais',
      description: 'Promotor Carlos Souza possui visitas vencidas na Operação SP-Leste.',
      time: 'Há 1 hora',
      read: false,
      link: '/dashboard/conciliacao?status=DATE_MISMATCH',
      linkLabel: 'Ver pendências',
    },
    {
      id: '3',
      type: 'system',
      title: 'Atualização de Sistema',
      description: 'Os servidores de sincronização foram otimizados para bases grandes.',
      time: 'Há 1 dia',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'import':
        return <Upload className="h-3.5 w-3.5 text-blue-500" />;
      case 'reconciliation':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Notificações"
        className="icon-button relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--mk-primary)] text-[9px] font-bold text-white ring-2 ring-[var(--mk-nav)]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2.5 w-80 sm:w-96 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-card-raised)] shadow-[var(--mk-shadow)] animate-fadeIn overflow-hidden">
            <header className="flex items-center justify-between border-b border-[var(--mk-border)] bg-[var(--mk-hover)]/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--mk-text)]">Notificações</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[var(--mk-primary)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--mk-primary)]">
                    {unreadCount} novas
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[var(--mk-text-subtle)] hover:text-[var(--mk-text)] transition"
                >
                  <Check className="h-3 w-3" />
                  Lidas
                </button>
              )}
            </header>

            <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--mk-border)]">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--mk-text-subtle)]">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 transition ${item.read ? 'bg-transparent' : 'bg-[var(--mk-primary)]/[0.02]'}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)]">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs truncate ${item.read ? 'font-medium text-[var(--mk-text)]' : 'font-bold text-[var(--mk-text)]'}`}>
                            {item.title}
                          </p>
                          <span className="text-[9px] text-[var(--mk-text-subtle)] whitespace-nowrap">{item.time}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--mk-text-secondary)]">
                          {item.description}
                        </p>
                        {item.link && (
                          <Link
                            href={item.link}
                            onClick={() => setIsOpen(false)}
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--mk-primary)] hover:underline"
                          >
                            <ClipboardCheck className="h-3 w-3" />
                            {item.linkLabel || 'Visualizar'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
