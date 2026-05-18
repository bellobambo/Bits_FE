'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { motion } from 'framer-motion';


export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  // Find the MetaMask connector
  const metamaskConnector = connectors.find(
    (c) => c.name.toLowerCase().includes('meta') // works for 'MetaMask'
  )

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 mt-[180px]">
      <motion.button
        onClick={() => metamaskConnector && connect({ connector: metamaskConnector })}
        className="px-4 py-3 bg-[#FFFDD0] cursor-pointer text-[#3D441A] rounded-lg transition-colors"
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
      >
        Connect To Proof
      </motion.button>
    </div>
  )
}





// 'use client'

// import { useAccount, useConnect, useDisconnect } from 'wagmi'

// export function WalletConnect() {
//   const { address, isConnected } = useAccount()
//   const { connectors, connect } = useConnect()
//   const { disconnect } = useDisconnect()

//   if (isConnected) {
//     return (
//       <div className="flex items-center gap-4">
//         <span className="text-sm text-gray-600">
//           {address?.slice(0, 6)}...{address?.slice(-4)}
//         </span>
//         <button
//           onClick={() => disconnect()}
//           className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
//         >
//           Disconnect
//         </button>
//       </div>
//     )
//   }

//   return (
//     <div className="flex gap-2">
//       {connectors.map((connector) => (
//         <button
//           key={connector.uid}
//           onClick={() => connect({ connector })}
//           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//         >
//           Connect {connector.name}
//         </button>
//       ))}
//     </div>
//   )
// }