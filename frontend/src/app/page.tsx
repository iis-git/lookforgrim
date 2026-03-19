'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  API_BASE_URL,
  ApiError,
  getHealth,
  getMe,
  login,
  refreshTokens,
} from '@/lib/api';
import { clearSession, readSession, writeSession } from '@/lib/auth-storage';
import type { AuthSession } from '@/lib/types';

type ScreenMode = 'checking' | 'guest' | 'authorized';
type HealthMode = 'idle' | 'ok' | 'error';

function roleToLabel(role: string): string {
  const normalized = role.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function readErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export default function HomePage() {
  const [mode, setMode] = useState<ScreenMode>('checking');
  const [session, setSession] = useState<AuthSession | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [healthMode, setHealthMode] = useState<HealthMode>('idle');
  const [healthText, setHealthText] = useState('Checking API...');

  const createdAtLabel = useMemo(() => {
    if (!session) {
      return '—';
    }

    const parsed = new Date(session.user.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return session.user.createdAt;
    }

    return parsed.toLocaleString('ru-RU');
  }, [session]);

  const probeHealth = useCallback(async (): Promise<void> => {
    try {
      const result = await getHealth();
      setHealthMode('ok');
      setHealthText(`API: ${result.status} (${new Date(result.timestamp).toLocaleTimeString('ru-RU')})`);
    } catch {
      setHealthMode('error');
      setHealthText('API недоступен');
    }
  }, []);

  const resolveSession = useCallback(async (current: AuthSession): Promise<AuthSession | null> => {
    try {
      const user = await getMe(current.accessToken);
      return { ...current, user };
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        return null;
      }

      const refreshed = await refreshTokens(current.refreshToken);
      const user = await getMe(refreshed.accessToken);

      return {
        ...refreshed,
        user,
      };
    }
  }, []);

  const bootstrapSession = useCallback(async (): Promise<void> => {
    const stored = readSession();

    if (!stored) {
      setMode('guest');
      return;
    }

    const resolved = await resolveSession(stored).catch(() => null);

    if (!resolved) {
      clearSession();
      setSession(null);
      setMode('guest');
      return;
    }

    writeSession(resolved);
    setSession(resolved);
    setMode('authorized');
  }, [resolveSession]);

  useEffect(() => {
    void bootstrapSession();
    void probeHealth();
  }, [bootstrapSession, probeHealth]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setBusy(true);
    setFormError(null);
    setActionMessage(null);

    try {
      const result = await login(email.trim(), password);
      writeSession(result);
      setSession(result);
      setMode('authorized');
      setPassword('');
      setActionMessage('Вход выполнен. Сессия сохранена в браузере.');
    } catch (error) {
      setFormError(readErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function onSyncProfile(): Promise<void> {
    if (!session) {
      return;
    }

    setBusy(true);
    setFormError(null);
    setActionMessage(null);

    const resolved = await resolveSession(session).catch(() => null);

    if (!resolved) {
      clearSession();
      setSession(null);
      setMode('guest');
      setFormError('Сессия истекла. Войдите снова.');
      setBusy(false);
      return;
    }

    writeSession(resolved);
    setSession(resolved);
    setActionMessage('Профиль обновлён через /auth/me.');
    setBusy(false);
  }

  function onLogout(): void {
    clearSession();
    setSession(null);
    setMode('guest');
    setPassword('');
    setActionMessage('Вы вышли из системы.');
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />

      <section className="panel">
        <p className="eyebrow">Lookforgrim • Frontend MVP</p>
        <h1>Панель входа</h1>
        <p className="subtitle">
          Текущий API: <code>{API_BASE_URL}</code>
        </p>

        <div className={`health health--${healthMode}`}>
          <span className="health-dot" />
          <span>{healthText}</span>
        </div>

        {mode === 'checking' ? (
          <div className="state-card">Проверяем сохранённую сессию...</div>
        ) : null}

        {mode === 'guest' ? (
          <form className="stack" onSubmit={onSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="admin@lookforgrim.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>

            {formError ? <p className="alert alert--error">{formError}</p> : null}
            {actionMessage ? <p className="alert alert--success">{actionMessage}</p> : null}

            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? 'Входим...' : 'Войти'}
            </button>
          </form>
        ) : null}

        {mode === 'authorized' && session ? (
          <div className="stack">
            <div className="user-grid">
              <article>
                <span>Email</span>
                <strong>{session.user.email}</strong>
              </article>
              <article>
                <span>Роль</span>
                <strong>{roleToLabel(session.user.role)}</strong>
              </article>
              <article>
                <span>Активен</span>
                <strong>{session.user.isActive ? 'Да' : 'Нет'}</strong>
              </article>
              <article>
                <span>Создан</span>
                <strong>{createdAtLabel}</strong>
              </article>
            </div>

            {formError ? <p className="alert alert--error">{formError}</p> : null}
            {actionMessage ? <p className="alert alert--success">{actionMessage}</p> : null}

            <div className="actions">
              <button className="btn btn--primary" onClick={onSyncProfile} disabled={busy}>
                {busy ? 'Обновляем...' : 'Проверить /auth/me'}
              </button>
              <button className="btn btn--ghost" onClick={onLogout} disabled={busy}>
                Выйти
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
