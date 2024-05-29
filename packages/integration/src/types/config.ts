export interface IntegrationTestConfig {
  // from chain name
  from: string;
  // to chain name
  to: string;
  endpoint: string;
  signer: string;
  addressOrmp: string;
  addressMsgport: string;
  addressOracle: string;
  addressRelayer: string;
  sourceChainId: number;
  targetChainId: number;
  version: number;
}
