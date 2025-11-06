/**
 * Client-side API utility for making secure requests.
 * Automatically handles CSRF token inclusion for state-changing requests.
 */

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Fetches and caches the CSRF token from the server.
 * Prevents race conditions by reusing in-flight requests.
 *
 * @returns The CSRF token
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  // If a fetch is already in progress, reuse it to prevent race conditions
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = fetch("/api/csrf-token")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }
      const data: { token: string } = await response.json();
      csrfToken = data.token;
      return data.token;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
}

/**
 * Clears the cached CSRF token.
 * Call this after a 403 error to force token refresh.
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  csrfTokenPromise = null;
}

/**
 * Makes an API request with automatic CSRF token inclusion for state-changing methods.
 *
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns The fetch response
 *
 * @example
 * ```typescript
 * // POST request with CSRF protection
 * const response = await apiRequest('/api/tours', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'My Tour' }),
 * });
 * const data = await response.json();
 *
 * // GET request (no CSRF token needed)
 * const tours = await apiRequest('/api/tours').then(r => r.json());
 * ```
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || "GET";
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Clone headers to avoid mutating the original options
  const headers = new Headers(options.headers);

  // Set default content type if not provided
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  // Add CSRF token for state-changing requests
  if (needsCsrf) {
    try {
      const token = await getCsrfToken();
      headers.set("X-CSRF-Token", token);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to get CSRF token:", error);
      throw new Error("Unable to make secure request. Please refresh the page and try again.");
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Clear cached CSRF token on 403 to force refresh on retry
  // The next request will automatically fetch a new token
  if (response.status === 403) {
    clearCsrfToken();
  }

  return response;
}

/**
 * Makes a GET request to the API.
 *
 * @param url - The API endpoint URL
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function get(url: string, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, { ...options, method: "GET" });
}

/**
 * Makes a POST request to the API with CSRF protection.
 *
 * @param url - The API endpoint URL
 * @param body - The request body
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function post(url: string, body?: unknown, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Makes a PATCH request to the API with CSRF protection.
 *
 * @param url - The API endpoint URL
 * @param body - The request body
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function patch(url: string, body?: unknown, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Makes a DELETE request to the API with CSRF protection.
 *
 * @param url - The API endpoint URL
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function del(url: string, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, { ...options, method: "DELETE" });
}

/**
 * Helper function to handle API errors consistently.
 *
 * @param response - The fetch response
 * @returns The parsed JSON data
 * @throws Error with the error message from the API
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred";

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Export a default object with all methods
export default {
  request: apiRequest,
  get,
  post,
  patch,
  delete: del,
  handleResponse: handleApiResponse,
  clearCsrfToken,
};
