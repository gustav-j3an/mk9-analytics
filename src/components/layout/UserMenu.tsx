'use client';

import React, { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Abrir menu do usuário"
        className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:border-[var(--mk-border)] hover:bg-[var(--mk-hover)]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--mk-bg-secondary)] text-[var(--mk-primary)]">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="hidden flex-col text-left sm:flex">
          <span className="text-xs font-semibold leading-none text-[var(--mk-text)]">Administrador</span>
          <span className="mt-1 text-[9px] text-[var(--mk-text-subtle)]">Acesso local</span>
        </div>
        <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--mk-text-subtle)] sm:block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-[var(--mk-border-strong)] bg-[var(--mk-card-raised)] p-1.5 shadow-[var(--mk-shadow)] animate-fadeIn">
            {/* Header info */}
            <div className="px-2 py-2 border-b border-[var(--mk-border)] mb-1">
              <p className="text-xs font-bold text-[var(--mk-text)]">Sessão Local</p>
              <p className="text-[9px] text-[var(--mk-text-subtle)] mt-0.5">Sua conta de demonstração administrativa</p>
            </div>

            {/* Links */}
            <div className="space-y-0.5">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--mk-text-secondary)] hover:bg-[var(--mk-hover)] hover:text-[var(--mk-text)] transition"
              >
                <User className="h-3.5 w-3.5 text-[var(--mk-text-subtle)]" />
                <span>Meu perfil</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--mk-text-secondary)] hover:bg-[var(--mk-hover)] hover:text-[var(--mk-text)] transition"
              >
                <Settings className="h-3.5 w-3.5 text-[var(--mk-text-subtle)]" />
                <span>Configurações</span>
              </Link>

              <div className="border-t border-[var(--mk-border)] my-1" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  alert('Demonstração: Sessão administrativa encerrada.');
                }}
                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--mk-danger)] hover:bg-[var(--mk-danger)]/5 transition text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Encerrar sessão</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};