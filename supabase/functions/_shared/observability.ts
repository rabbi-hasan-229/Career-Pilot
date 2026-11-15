type LogLevel = 'info' | 'warn' | 'error';
type LogAttributes = Record<string, string | number | boolean | null>;

export interface EdgeRequestContext {
  requestId: string;
  log: (level: LogLevel, event: string, attributes?: LogAttributes) => void;
}

type EdgeHandler = (request: Request, context: EdgeRequestContext) => Response | Promise<Response>;

function structuredLog(
  functionName: string,
  requestId: string,
  level: LogLevel,
  event: string,
  attributes: LogAttributes = {},
): void {
  const message = JSON.stringify({
    ...attributes,
    timestamp: new Date().toISOString(),
    level,
    event,
    function: functionName,
    request_id: requestId,
  });
  if (level === 'error') console.error(message);
  else if (level === 'warn') console.warn(message);
  else console.info(message);
}

async function responseWithRequestId(response: Response, requestId: string): Promise<Response> {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', headers.get('Access-Control-Allow-Origin') || '*');
  headers.set('Access-Control-Allow-Methods', headers.get('Access-Control-Allow-Methods') || 'POST, OPTIONS');
  headers.set('x-request-id', requestId);

  const exposedHeaders = (headers.get('Access-Control-Expose-Headers') || '')
    .split(',')
    .map((header) => header.trim())
    .filter(Boolean);
  if (!exposedHeaders.some((header) => header.toLowerCase() === 'x-request-id')) exposedHeaders.push('x-request-id');
  headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));

  if (headers.get('content-type')?.toLowerCase().includes('application/json') && response.body) {
    try {
      const body = await response.clone().json() as unknown;
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        headers.delete('content-length');
        headers.delete('content-encoding');
        return new Response(JSON.stringify({ ...(body as Record<string, unknown>), request_id: requestId }), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    } catch {
      // Preserve non-JSON or malformed provider responses as returned by the handler.
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Adds a request ID and privacy-safe structured completion log to every response. */
export function serveObservedEdgeFunction(functionName: string, handler: EdgeHandler): void {
  Deno.serve(async (request: Request) => {
    const requestId = crypto.randomUUID();
    const startedAt = performance.now();
    const context: EdgeRequestContext = {
      requestId,
      log: (level, event, attributes) => structuredLog(functionName, requestId, level, event, attributes),
    };

    let result: Response;
    try {
      result = await handler(request, context);
    } catch (error) {
      context.log('error', 'request.unhandled_exception', {
        error_name: error instanceof Error ? error.name : 'UnknownError',
      });
      result = new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json',
        },
      });
    }

    const response = await responseWithRequestId(result, requestId);
    const attributes = {
      method: request.method,
      status_code: response.status,
      duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
    };
    context.log(response.status >= 500 ? 'error' : 'info', response.status >= 500 ? 'request.failed' : 'request.completed', attributes);
    return response;
  });
}
