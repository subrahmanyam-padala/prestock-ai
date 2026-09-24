import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WalletProviders } from './components/WalletProviders';
import { DataProvider } from './context/DataContext';
import { StoreProvider } from './context/StoreContext';
import './index.css';

// Some Solana libraries expect a global Buffer in the browser.
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProviders>
        <DataProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </DataProvider>
      </WalletProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
