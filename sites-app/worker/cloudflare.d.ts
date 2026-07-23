interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes?: number } & Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface R2PutOptions {
  httpMetadata?: { contentType?: string; cacheControl?: string };
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView, options?: R2PutOptions): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}
