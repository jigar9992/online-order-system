const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000/api";

type HttpMethod = "GET" | "POST";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function buildApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function apiRequest<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<TResponse> {
  const requestInit: RequestInit = {
    method,
    credentials: "include",
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      requestInit.body = body;
    } else {
      requestInit.headers = { "Content-Type": "application/json" };
      requestInit.body = JSON.stringify(body);
    }
  }

  const response = await fetch(buildApiUrl(path), requestInit);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (typeof errorBody.message === "string") {
        message = errorBody.message;
      }
    } catch {
      // Keep the default status-based message when the body is empty or not JSON.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return apiRequest<TResponse>("GET", path);
}

export function apiPost<TRequest, TResponse>(
  path: string,
  body?: TRequest,
): Promise<TResponse> {
  return apiRequest<TResponse>("POST", path, body);
}
