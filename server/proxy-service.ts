import axios from 'axios';
import { createVpnConnection, updateVpnConnection } from './db';

// Proxy server configurations for different locations
const PROXY_SERVERS = {
  'us-east': { host: 'proxy.webshare.io', port: 80, location: 'New York' },
  'us-west': { host: 'proxy.webshare.io', port: 80, location: 'Los Angeles' },
  'uk': { host: 'proxy.webshare.io', port: 80, location: 'London' },
  'germany': { host: 'proxy.webshare.io', port: 80, location: 'Frankfurt' },
  'japan': { host: 'proxy.webshare.io', port: 80, location: 'Tokyo' },
  'singapore': { host: 'proxy.webshare.io', port: 80, location: 'Singapore' },
  'australia': { host: 'proxy.webshare.io', port: 80, location: 'Sydney' },
  'canada': { host: 'proxy.webshare.io', port: 80, location: 'Toronto' },
};

export interface ProxyRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  data: any;
  bytesTransferred: number;
}

/**
 * Route HTTP request through proxy server
 */
export async function routeThroughProxy(
  userId: number,
  serverId: string,
  request: ProxyRequest
): Promise<ProxyResponse> {
  const server = PROXY_SERVERS[serverId as keyof typeof PROXY_SERVERS];
  if (!server) {
    throw new Error('Invalid server ID');
  }

  // Create connection record
  const connectionResult = await createVpnConnection({
    userId,
    server: serverId,
    protocol: 'proxy',
  });

  const connectionId = connectionResult ? Number(connectionResult[0].insertId) : null;

  try {
    // Make request through proxy
    const response = await axios({
      method: request.method,
      url: request.url,
      headers: request.headers,
      data: request.body,
      proxy: {
        host: server.host,
        port: server.port,
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    // Calculate bytes transferred
    const requestSize = JSON.stringify(request).length;
    const responseSize = JSON.stringify(response.data).length;
    const bytesTransferred = requestSize + responseSize;

    // Update connection with traffic data
    if (connectionId) {
      await updateVpnConnection(connectionId, {
        disconnectedAt: new Date(),
        bytesUploaded: requestSize,
        bytesDownloaded: responseSize,
        bytesTransferred,
      });
    }

    return {
      status: response.status,
      headers: response.headers as Record<string, string>,
      data: response.data,
      bytesTransferred,
    };
  } catch (error: any) {
    if (connectionId) {
      await updateVpnConnection(connectionId, {
        disconnectedAt: new Date(),
      });
    }
    throw new Error(`Proxy request failed: ${error.message}`);
  }
}

export function getProxyConfig(serverId: string) {
  const server = PROXY_SERVERS[serverId as keyof typeof PROXY_SERVERS];
  if (!server) {
    throw new Error('Invalid server ID');
  }

  return {
    host: server.host,
    port: server.port,
    protocol: 'http',
    location: server.location,
  };
}

export async function testProxyConnection(serverId: string): Promise<number> {
  const startTime = Date.now();
  
  try {
    await axios.get('https://www.google.com', {
      proxy: {
        host: PROXY_SERVERS[serverId as keyof typeof PROXY_SERVERS].host,
        port: PROXY_SERVERS[serverId as keyof typeof PROXY_SERVERS].port,
      },
      timeout: 10000,
    });
    
    return Date.now() - startTime;
  } catch (error) {
    throw new Error('Proxy connection test failed');
  }
}
