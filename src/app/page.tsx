import SwapInterface from '@/components/SwapInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative" style={{backgroundImage: 'url(/backgroundimage.png)'}}>
      {/* Semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-8">
          {/* <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Monad Swap DApp
          </h1> */}
          {/* <p className="text-lg text-gray-600">
            Decentralized token swapping on Monad Testnet
          </p> */}
          <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Monad Testnet
            </span>
            {/* <span className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Powered by 0x Protocol
            </span> */}
          </div>
        </header>

        <main>
          <SwapInterface />
        </main>

        <footer className="mt-16 text-center text-gray-500">
          <div className="flex justify-center items-center space-x-6 mb-4">
            <a
              href="https://testnet.monadscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              MonadScan Explorer
            </a>
            <span>•</span>
            <a
              href="https://docs.monad.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Monad Docs
            </a>
            <span>•</span>
            <a
              href="https://0x.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              0x Protocol
            </a>
          </div>
          {/* <p className="text-sm">
            Built with Next.js, wagmi, and RainbowKit
          </p> */}
        </footer>
      </div>
    </div>
  );
}
