// Monad Testnet token addresses
export const WMON_TOKEN_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" as const;
export const USDC_TESTNET_ADDRESS = "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea" as const;

// 0x API configuration
export const ZERO_EX_API_BASE_URL = "https://api.0x.org/swap/allowance-holder" as const;

// Token information
export const TOKENS = {
  WMON: {
    address: WMON_TOKEN_ADDRESS,
    symbol: "WMON",
    name: "Wrapped MON",
    decimals: 18,
    logo: "/tokens/wmon.png", // You can add token logos later
  },
  USDC: {
    address: USDC_TESTNET_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "/tokens/usdc.png", // You can add token logos later
  },
} as const;
