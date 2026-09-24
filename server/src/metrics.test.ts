import assert from 'node:assert/strict';
import { computePortfolio, spreadPct } from './metrics';
import { PreStock } from './types';

const mk = (symbol: string, tokenPrice: number, markPrice: number): PreStock => ({
  name: symbol, symbol, description: '', image: '', external_url: '',
  contract_address: 'x'.repeat(44), markPrice, markValuation: 1, tokenPrice, impliedValuation: 1, supply: 1,
});

assert.equal(spreadPct(mk('A', 110, 100)), 10);
const p = computePortfolio([mk('A', 100, 100), mk('B', 50, 100)], 10000, [
  { symbol: 'A', percent: 60 }, { symbol: 'B', percent: 40 },
]);
assert.equal(p.hhi, 5200);
assert.equal(p.top.symbol, 'A');
assert.equal(p.rows[1].quantity, 80);
assert.equal(p.scenarios.largestFalls30.valueChangeUsd, -1800);
// B would double to mark: +4000
assert.equal(p.scenarios.spreadsCloseToMark.valueChangeUsd, 4000);
console.log('metrics tests passed');
