export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_JUNTO_API_BASE_URL as string) ||
  '/api';

class ApiClient {
  private base: string;

  constructor(base: string) {
    this.base = base.replace(/\/+$/, '');
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem('junto_support_token');
    } catch {
      return null;
    }
  }

  public setToken(token: string | null): void {
    try {
      token ? localStorage.setItem('junto_support_token', token) : localStorage.removeItem('junto_support_token');
    } catch {
      // Ignore storage errors
    }
  }

  public buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return this.base.endsWith('/api') && clean.startsWith('/api/')
      ? `${this.base}${clean.slice(4)}`
      : `${this.base}${clean}`;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers, credentials: 'include' });
      if (res.status === 204) return {} as T;

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const msg = (typeof data === 'object' && (data?.error || data?.message)) || res.statusText || 'API error';
        throw new ApiError(res.status, msg, data);
      }
      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, err.message || 'Network error');
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    if (!params) return this.request<T>(endpoint, { method: 'GET' });
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') qs.append(k, String(v));
    });
    const query = qs.toString();
    return this.request<T>(query ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}` : endpoint, { method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  public patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
