interface SafeFetchResult<T> {
  data: T | null;
  error: string | null;
  ok: boolean;
}

export async function safeFetch<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, { cache: 'no-store', ...options });

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error) errorMsg = body.error;
      } catch {
        // empty or non-JSON body
      }
      return { data: null, error: errorMsg, ok: false };
    }

    // Handle empty responses (204, etc.)
    const text = await res.text();
    if (!text) {
      return { data: null, error: null, ok: true };
    }

    try {
      const data = JSON.parse(text) as T;
      return { data, error: null, ok: true };
    } catch {
      return { data: null, error: 'Invalid JSON response', ok: false };
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
      ok: false,
    };
  }
}
