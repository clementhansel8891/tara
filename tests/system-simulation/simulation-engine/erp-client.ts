import { SimLogger } from "./logger";
import { FaultInjector } from "../chaos-engine/fault-injector";

export interface ERPClientOptions {
  baseURL: string;
  tenantId?: string;
  locationId?: string;
  token?: string;
  faultInjector?: FaultInjector;
}

export class ERPClient {
  private logger: SimLogger;

  constructor(private options: ERPClientOptions) {
    this.logger = new SimLogger("erp-client");
  }

  setToken(token: string) {
    this.options.token = token;
  }

  setTenant(tenantId: string) {
    this.options.tenantId = tenantId;
  }

  setLocation(locationId: string) {
    this.options.locationId = locationId;
  }

  async get(url: string) {
    return this.request(url, { method: "GET" });
  }

  async post(url: string, data: any) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async put(url: string, data: any) {
    return this.request(url, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async delete(url: string) {
    return this.request(url, { method: "DELETE" });
  }

  private async request(url: string, options: RequestInit) {
    const fullUrl = `${this.options.baseURL}${url}`;
    const headers: any = {
      ...options.headers,
      "x-tenant-id": this.options.tenantId || "unassigned",
      "x-dev-bypass": "true",
      "x-dev-role": "OWNER",
    };

    if (this.options.locationId) {
      headers["x-location-id"] = this.options.locationId;
    }

    if (this.options.token) {
      headers["Authorization"] = `Bearer ${this.options.token}`;
    }

    // Chaos Injection
    if (this.options.faultInjector) {
      try {
        this.options.faultInjector.maybeInjectFailure(url);
      } catch (e: any) {
        return { success: false, status: 500, data: { message: e.message } };
      }
    }

    this.logger.log(`[DEBUG] Requesting ${options.method} ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      let body = await response.json().catch(() => ({}));

      // UNWRAP STANDARD ENVELOPE
      // If the body is { success: true, data: { ... } }, we return the nested data as response.data
      const isWrapped =
        body && typeof body === "object" && "success" in body && "data" in body;
      const unwrappedData = isWrapped ? body.data : body;
      const success = isWrapped ? body.success : response.ok;

      if (!response.ok || !success) {
        this.logger.log(
          `[DEBUG] Error for ${fullUrl}: ${response.status} | ${JSON.stringify(body)}`,
        );
        return {
          success: false,
          status: response.status,
          data: unwrappedData,
        };
      }

      return {
        success: true,
        status: response.status,
        data: unwrappedData,
      };
    } catch (e: any) {
      this.logger.error(`Network error for ${fullUrl}`, e);
      return {
        success: false,
        status: 0,
        data: { message: e.message },
      };
    }
  }
}
