import type { LoginResponse, PublicUser, TokenPair } from './types';

const DEFAULT_API_BASE_URL = 'https://api.lookforgrim.online/v1';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const maybeMessage = (payload as { message?: unknown }).message;

  if (typeof maybeMessage === 'string') {
    return maybeMessage;
  }

  if (Array.isArray(maybeMessage)) {
    return maybeMessage.filter((item) => typeof item === 'string').join('; ');
  }

  return fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

async function request<T>(
  path: string,
  options: RequestInit,
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractMessage(body, `HTTP ${response.status}`),
      response.status,
      body,
    );
  }

  return body as T;
}

export function getHealth(): Promise<{ status: string; timestamp: string }> {
  return request('/health', { method: 'GET' });
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function getMe(accessToken: string): Promise<PublicUser> {
  return request('/auth/me', { method: 'GET' }, accessToken);
}
