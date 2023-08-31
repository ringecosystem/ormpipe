export enum StartTask {
  oracle = 'oracle',
  relayer = 'relayer',
}

export enum RelayFeature {
  oracle_delivery = 'oracle.delivery',
  oracle_aggregate = 'oracle.aggregate',
}

export interface RelayConfig {
  task: StartTask[]
  feature: RelayFeature[]
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
  sourceIndexerAirnodeEndpoint: string

  targetIndexerEndpoint: string
  targetIndexerOracleEndpoint: string
  targetIndexerRelayerEndpoint: string
  targetIndexerOrmpEndpoint: string
  targetIndexerAirnodeEndpoint: string

  sourceSigner: string
  sourceSignerAirnode: string
  sourceSignerRelayer: string
  targetSigner: string
  targetSignerAirnode: string
  targetSignerRelayer: string

  sourceAddressAirnode: string
  sourceAddressRelayer: string
  targetAddressAirnode: string
  targetAddressRelayer: string

}

export type StartRelayFlag = RelayConfig;

export interface OrmpRelayStartInput {
  tasks: StartTask[]
  features: RelayFeature[]
}

export interface RawOrmpRelayStartInput {
  task: StartTask
  features: RelayFeature[]
}
