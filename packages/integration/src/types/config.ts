


export interface IntegrationTestConfig {
  endpoint: string
  signer: string
  addressOrmp: string
  addressMsgport: string
  addressOracle: string
  addressRelayer: string
  sourceChainId: number,
  targetChainId: number
  version: number
}
