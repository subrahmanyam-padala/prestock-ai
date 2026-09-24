import { useState } from 'react';
import { ALERT_LABEL, alertUnit, useStore } from '../context/StoreContext';
import { useData } from '../context/DataContext';
import { AlertType } from '../types';

export function AlertForm({ symbol }: { symbol?: string }) {
  const { assets } = useData();
  const { addAlert } = useStore();
  const [sym, setSym] = useState(symbol ?? '');
  const [type, setType] = useState<AlertType>('spread_above');
  const [threshold, setThreshold] = useState('');
  const chosen = symbol ?? sym;
  const t = Number(threshold);
  const valid = chosen !== '' && threshold.trim() !== '' && Number.isFinite(t);
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1.3fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        addAlert({ symbol: chosen, type, threshold: t });
        setThreshold('');
      }}
    >
      {!symbol && (
        <div>
          <label className="label" htmlFor="al-sym">Asset</label>
          <select id="al-sym" className="input" value={sym} onChange={(e) => setSym(e.target.value)}>
            <option value="">Choose…</option>
            {assets.map((a) => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
          </select>
        </div>
      )}
      <div className={symbol ? 'sm:col-span-2' : ''}>
        <label className="label" htmlFor="al-type">Condition</label>
        <select id="al-type" className="input" value={type} onChange={(e) => setType(e.target.value as AlertType)}>
          {(Object.keys(ALERT_LABEL) as AlertType[]).map((k) => <option key={k} value={k}>{ALERT_LABEL[k]}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="al-th">Threshold ({alertUnit(type)})</label>
        <input id="al-th" className="input" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={type.startsWith('price') ? 'e.g. 500' : 'e.g. 10'} />
      </div>
      <button className="btn-primary" disabled={!valid}>Add alert</button>
    </form>
  );
}
