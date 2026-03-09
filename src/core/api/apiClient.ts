import { SessionContext } from "@/core/security/session";
import { API_BASE_URL } from "@/lib/api-config";

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data: any = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  session?: SessionContext,
  body?: unknown,
  tenantId?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const finalTenantId = tenantId || session?.tenantId;
  if (finalTenantId) {
    // Map tenant-demo to comp-demo-a for backend consistency
    headers["x-tenant-id"] =
      finalTenantId === "tenant-demo" ? "comp-demo-a" : finalTenantId;
  }

  if (session) {
    headers["x-actor-id"] = session.userId;
    headers["x-user-role"] = session.role;
    if (session.locationId) {
      headers["x-location-id"] = session.locationId;
    }
    if (session.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
  }

  console.log(`[apiClient] Request: ${method} ${API_BASE_URL}${path}`, {
    tenantHeader: headers["x-tenant-id"],
    hasAuth: !!headers["Authorization"],
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.detail ||
      errorData.message ||
      `API request failed with status ${response.status}`;

    console.error(
      `[apiClient] Error ${response.status}: ${message}`,
      errorData,
    );
    throw new ApiError(message, response.status, errorData);
  }

  const result = await response.json();

  // If the result contains data AND meta (pagination), merge them if possible or return root
  if (result && typeof result === "object") {
    if (result.data !== undefined && result.meta !== undefined) {
      if (Array.isArray(result.data)) {
        // Return the array with meta attached to match the frontend "paginated array" pattern
        return Object.assign(result.data, { meta: result.meta }) as T;
      }
      return result.data as T;
    }
    if (result.data !== undefined) {
      return result.data as T;
    }
  }

  return result as T;
}
