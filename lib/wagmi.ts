import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const mantleTestnet = {
    id: 5003,
    name: 'Mantle Sepolia',
    network: 'mantle-sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'Mantle',
        symbol: 'MNT',
    },
    rpcUrls: {
        default: {
            http: [process.env.NEXT_PUBLIC_MANTLE_TESTNET_RPC_URL || 'https://rpc.sepolia.mantle.xyz'],
        },
        public: {
            http: [
                process.env.NEXT_PUBLIC_MANTLE_TESTNET_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
            ],
        },
    },
    blockExplorers: {
        default: {
            name: 'Mantle Sepolia Explorer',
            url: 'https://sepolia.mantlescan.xyz',
        },
    },
    testnet: true,
} as const

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

export const config = createConfig({
    chains: [mantleTestnet, sepolia],
    connectors: [
        injected(),
        ...(projectId ? [walletConnect({
            projectId,
            showQrModal: true,
            qrModalOptions: {
                themeMode: 'light',
            }
        })] : []),
    ],
    transports: {
        [mantleTestnet.id]: http(process.env.NEXT_PUBLIC_MANTLE_TESTNET_RPC_URL || 'https://rpc.sepolia.mantle.xyz'),
        [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    },
    ssr: true,
})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}
