export const APTOS_COIN = "0x1::aptos_coin::AptosCoin";

const mainnetCoinConfig = {
  APT: {
    coinType: APTOS_COIN,
    unit: 10 ** 8,
  },
  MOON: {
    coinType: "",
    unit: 10 ** 6,
  },
};

const testnetCoinConfig = {
  APT: {
    coinType: APTOS_COIN,
    unit: 10 ** 8,
  },
  MOON: {
    coinType:
      "0xd71e041f0d9c871e68604699aa109ead5643ced548f9d216ddb89702968e5458::moon_coin::MoonCoin",
    unit: 10 ** 6,
  },
};

const getNetworkCoinConfig = (network: string) => {
  switch (network?.toLowerCase()) {
    case "mainnet":
      return mainnetCoinConfig;
    case "testnet":
      return testnetCoinConfig;
    default:
      throw testnetCoinConfig;
  }
};

export default getNetworkCoinConfig;
