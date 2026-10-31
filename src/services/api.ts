/**
 * Centralized API client for Junto Support Management Dashboard.
 * Configured via VITE_API_BASE_URL or VITE_JUNTO_API_BASE_URL (defaults to /api).
 * Supports HttpOnly session cookies (credentials: 'include') and Bearer auth headers.
 */

export class ApiError extends Error {
  status: number;
  data: any;
  isSessionExpired: boolean;
  isAccessDenied: boolean;
  isNotFound: boolean;
  isServerError: boolean;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isSessionExpired = status === 401;
    this.isAccessDenied = status === 403;
    this.isNotFound = status === 404;
    this.isServerError = status >= 500;
  }
}

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_JUNTO_API_BASE_URL as string) ||
  '/api';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Prevent duplicate /api if baseUrl already has /api
    if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
      return `${base}${cleanEndpoint.slice(4)}`;
    }

    // Prevent duplicate /support if baseUrl already ends in /support
    if (base.endsWith('/support') && cleanEndpoint.startsWith('/support/')) {
      return `${base}${cleanEndpoint.slice(8)}`;
    }

    return `${base}${cleanEndpoint}`;
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem('junto_support_token');
    } catch {
      return null;
    }
  }

  public setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem('junto_support_token', token);
      } else {
        localStorage.removeItem('junto_support_token');
      }
    } catch (e) {
      console.warn('Unable to persist token to localStorage', e);
    }
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Transmit HttpOnly session cookies
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return {} as T;
      }

      let responseData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          (responseData && typeof responseData === 'object' && (responseData.error || responseData.message)) ||
          response.statusText ||
          `Request failed with status ${response.status}`;

        throw new ApiError(response.status, errorMessage, responseData);
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error, fetch abort or offline
      throw new ApiError(0, (error as Error).message || 'Network error occurred. Check backend connection.');
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
          queryParams.append(key, String(value));
        }
      });
      const qs = queryParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
