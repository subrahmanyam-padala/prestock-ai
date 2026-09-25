import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8787),
  prestocksUrl: process.env.PRESTOCKS_API_URL ?? 'https://prestocks.com/api/prestocks',
  cacheTtlMs: 30_000,
  staleMaxMs: 10 * 60_000,
  upstreamTimeoutMs: 8_000,
  geminiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
  solanaRpc: process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, '')),
};
