import { NetworkConfiguration } from "./index";

export const aptosConfigType = "stream::GlobalConfig";
export const aptosStreamType = "stream::StreamInfo"

const LOCAL_CONFIG = new NetworkConfiguration(
  'localhost',
  'http://0.0.0.0:8080',
  'http://0.0.0.0:8000',
  'contract',
  'backend',
  'backendNet',
);

const DEVNET_CONFIG = new NetworkConfiguration(
  'devnet',
  'https://fullnode.devnet.aptoslabs.io',
  'https://faucet.devnet.aptoslabs.com',
  '0x6b65512795f4cb492e2d8713b3ce1aba624516479c3b7b51a73b91cfa3a5b16f',
  'https://api.moveflow.xyz/api',
  'apt_devnet'
);

const TESTNET_CONFIG = new NetworkConfiguration(
  'testnet',
  'https://fullnode.testnet.aptoslabs.com/v1',
  'https://faucet.testnet.aptoslabs.com',
  '0xd71e041f0d9c871e68604699aa109ead5643ced548f9d216ddb89702968e5458',
  'https://testnet.api.moveflow.xyz/api',
  'apt_testnet',
);

const MAINNET_CONFIG = new NetworkConfiguration(
  'mainnet',
  'https://fullnode.mainnet.aptoslabs.com/v1',
  '',
  '0x78daa336e5da7dcfef7ed1c3ffc8006dfe0aee460b7c4d28bbd854a93e5afb97',
  'https://api.moveflow.xyz/api',
  'apt_mainnet'
);

const getNetworkConfiguration = (env: string): NetworkConfiguration => {
  switch (env) {
    case "Localhost":
      return LOCAL_CONFIG;
    case "Devnet":
      return DEVNET_CONFIG;
    case "Testnet":
      return TESTNET_CONFIG;
    case "Mainnet":
      return MAINNET_CONFIG;
    default:
      return LOCAL_CONFIG;
  }
};

const netConfApt = getNetworkConfiguration(process.env.REACT_APP_CURRENT_NETWORK as string);
// const netConfApt = getNetworkConfiguration("Testnet");
export default netConfApt;