const API_BASE_URL = 'https://customerdb.eposnorth.co.uk';

interface ApiOptions extends RequestInit {
  body?: string;
}

export interface User {
  username: string;
  admin: boolean;
}

export interface CustomerRow {
  [key: string]: string | number | undefined;
}

export interface CustomersResponse {
  columns: string[];
  idColumn: string;
  rows: CustomerRow[];
  total: number;
}

export interface DatabasesResponse {
  databases: string[];
}

export interface MeResponse {
  user: User;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  private async request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    console.log(`[API] ${opts.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers,
      },
      credentials: 'include',
      ...opts,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      const msg = data?.error || `HTTP ${response.status}`;
      console.log(`[API] Error: ${msg}`);
      throw new Error(msg);
    }

    console.log(`[API] Success:`, data);
    return data;
  }

  async ping(): Promise<{ ts: string }> {
    return this.request('/api/ping');
  }

  async checkServerStatus(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch (e) {
      console.log('[API] Server status check failed:', e);
      return false;
    }
  }

  async getMe(): Promise<MeResponse> {
    return this.request('/api/me');
  }

  async login(username: string, passcode: string): Promise<{ user: User }> {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, passcode }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/api/logout', { method: 'POST' });
  }

  async getDatabases(): Promise<DatabasesResponse> {
    return this.request('/api/databases');
  }

  async getCustomers(
    db: string,
    q: string = '',
    skip: number = 0,
    take: number = 200
  ): Promise<CustomersResponse> {
    const params = new URLSearchParams({
      db,
      q,
      skip: skip.toString(),
      take: take.toString(),
    });
    return this.request(`/api/customers?${params}`);
  }

  async addCustomer(db: string, values: Record<string, string>): Promise<void> {
    return this.request(`/api/customers?db=${encodeURIComponent(db)}`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  }

  async updateCustomer(db: string, id: string, values: Record<string, string>): Promise<void> {
    return this.request(`/api/customers/${encodeURIComponent(id)}?db=${encodeURIComponent(db)}`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  }

  async deleteCustomer(db: string, id: string): Promise<void> {
    return this.request(`/api/customers/${encodeURIComponent(id)}?db=${encodeURIComponent(db)}`, {
      method: 'DELETE',
    });
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    const looksGBPostcode = /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/i.test(address);
    const hasHomeNation = /\b(SCOTLAND|ENGLAND|WALES|NORTHERN\s+IRELAND)\b/i.test(address);
    const cc = looksGBPostcode || hasHomeNation ? '&countrycodes=gb' : '';

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1${cc}&q=${encodeURIComponent(address)}`;
    
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      const arr = await response.json();
      
      if (Array.isArray(arr) && arr.length > 0) {
        const lat = parseFloat(arr[0].lat);
        const lon = parseFloat(arr[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return { lat, lon };
        }
      }
    } catch (e) {
      console.log('[API] Geocode error:', e);
    }
    
    return null;
  }

  async osrmTrip(stops: { lat: number; lon: number }[]): Promise<any> {
    const coords = stops.map((s) => `${s.lon},${s.lat}`).join(';');
    const path = `trip/v1/driving/${coords}?geometries=geojson&overview=full&roundtrip=false&source=first&destination=last`;
    
    try {
      const proxyUrl = `${this.baseUrl}/api/osrm?path=${encodeURIComponent(path)}`;
      const r = await fetch(proxyUrl, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      
      if (r.ok) {
        const d = await r.json();
        if (d?.code === 'Ok' && d?.trips?.length) {
          return d;
        }
      }
    } catch (e) {
      console.log('[API] OSRM proxy failed, trying direct:', e);
    }

    const directUrl = `https://router.project-osrm.org/${path}`;
    const r = await fetch(directUrl, {
      headers: { Accept: 'application/json' },
    });
    
    if (!r.ok) throw new Error(`Routing HTTP ${r.status}`);
    const d = await r.json();
    if (!d || d.code !== 'Ok' || !d.trips?.length) {
      throw new Error(d?.message || 'Routing failed');
    }
    return d;
  }
}

export const api = new ApiService();
