"use client";

import { WalletManager } from "@txnlab/use-wallet";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { pera } from "@txnlab/use-wallet-pera";

const manager = new WalletManager({
wallets: [pera()],
defaultNetwork: "testnet",
});

export default function Providers({ children }) {
return ( <WalletProvider manager={manager}>
{children} </WalletProvider>
);
}
