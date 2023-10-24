export enum StartTask {
  oracle = 'oracle',
  relayer = 'relayer',
}

export enum RelayFeature {
  oracle_delivery = 'oracle.delivery',
  oracle_aggregate = 'oracle.aggregate',
}

export interface RelayConfig {
  tasks: StartTask[]
  features: RelayFeature[]
  dataPath: string
  enableSourceToTarget: boolean
  enableTargetToSource: boolean

  sourceName: string
  sourceEndpoint: string

  targetName: string
  targetEndpoint: string

  sourceIndexerEndpoint: string
  sourceIndexerOracleEndpoint: string
  sourceIndexerRelayerEndpoint: string
  sourceIndexerOrmpEndpoint: string
  sourceIndexerSubapiEndpoint: string

  targetIndexerEndpoint: string
  targetIndexerOracleEndpoint: string
  targetIndexerRelayerEndpoint: string
  targetIndexerOrmpEndpoint: string
  targetIndexerSubapiEndpoint: string

  sourceSigner: string
  sourceSignerSubapi: string
  sourceSignerRelayer: string
  targetSigner: string
  targetSignerSubapi: string
  targetSignerRelayer: string

  sourceAddressSubapi: string
  sourceAddressRelayer: string
  targetAddressSubapi: string
  targetAddressRelayer: string

}

export interface OrmpRelayStartInput {
  task: StartTask
  features: RelayFeature[]
}
