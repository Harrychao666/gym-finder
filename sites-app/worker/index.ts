import { handleApiRequest } from "./api";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  FILES: R2Bucket | KVNamespace;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ADMIN_TOKEN?: string;
  PLATFORM_ADMIN_TOKEN?: string;
  UPLOAD_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  TENCENT_LBS_KEY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApiRequest(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
};

export default worker;
