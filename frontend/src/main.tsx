import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WalletManager, WalletId, NetworkId } from '@txnlab/use-wallet';
import { WalletProvider } from '@txnlab/use-wallet-react';

import { App } from './App';
import { getNetwork } from './lib/algorand';
import './index.css';

/**
 * WalletManager must be created OUTSIDE React components to avoid
 * re-initialization on re-renders. Configured with KMD (LocalNet)
 * and Pera (Testnet) wallet providers.
 */
const walletManager = new WalletManager({
  wallets: [
    {
      id: WalletId.KMD,
      options: {
        wallet: 'unencrypted-default-wallet',
        promptForPassword: async () => '',
      },
    },
    WalletId.PERA,
  ],
  defaultNetwork: getNetwork() === 'testnet' ? NetworkId.TESTNET : NetworkId.LOCALNET,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <WalletProvider manager={walletManager}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletProvider>
  </StrictMode>,
);
