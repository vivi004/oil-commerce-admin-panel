import { environment } from '../../../environments/environment';

/**
 * Safely executes a fetch request with an automatic timeout.
 * Prevents prolonged UI freezes when backend services are
 * unreachable or offline.
 */
export function getApiUrl(path: string): string {
  return `${environment.apiBaseUrl}${path}`;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = environment.apiTimeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
