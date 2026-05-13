import OpenAI from "openai";

// NOTE: For production PHI workloads, this call should be proxied through a
// server-side route so the API key is not exposed in the browser. Per the
// current spec, the key is read from VITE_AI_API_KEY at build time.
export const miraClient = new OpenAI({
  apiKey: (import.meta.env.VITE_AI_API_KEY as string | undefined) ?? "missing-key",
  baseURL: "https://api.ai.it.ufl.edu",
  dangerouslyAllowBrowser: true,
});

export const hasApiKey = Boolean(import.meta.env.VITE_AI_API_KEY);
