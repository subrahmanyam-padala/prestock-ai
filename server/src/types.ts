import { z } from 'zod';

// Mirrors the fields verified on https://prestocks.com/api/prestocks. Unknown fields are ignored.
export const PreStockSchema = z.object({
  name: z.string(),
  symbol: z.string().min(1),
  description: z.string().default(''),
  image: z.string().default(''),
  external_url: z.string().default(''),
  contract_address: z.string().min(32),
  markPrice: z.number(),
  markValuation: z.number(),
  tokenPrice: z.number(),
  impliedValuation: z.number(),
  supply: z.number(),
});
export const PreStocksResponseSchema = z.array(PreStockSchema).min(1);
export type PreStock = z.infer<typeof PreStockSchema>;

export const SymbolSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,20}$/);

export const AnalyzeAssetBody = z.object({ symbol: SymbolSchema });

export const AnalyzePortfolioBody = z
  .object({
    portfolioValue: z.number().positive().max(1e12),
    holdings: z
      .array(z.object({ symbol: SymbolSchema, percent: z.number().min(0).max(100) }))
      .min(1)
      .max(20),
  })
  .refine((b) => new Set(b.holdings.map((h) => h.symbol)).size === b.holdings.length, { message: 'Duplicate symbols' })
  .refine((b) => Math.abs(b.holdings.reduce((s, h) => s + h.percent, 0) - 100) < 0.01, {
    message: 'Allocations must total 100%',
  });
