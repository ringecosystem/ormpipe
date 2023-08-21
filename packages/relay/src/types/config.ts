
export enum StartTask {
  oracle = 'oracle',
  relayer = 'relayer',
}

export interface RelayConfig {
  sourceName: string
  sourceEndpoint: string

  targetName: string
  targetEndpoint: string

  sourceIndexerEndpoint: string
  sourceIndexerOracleEndpoint: string
  sourceIndexerRelayerEndpoint: string
  sourceIndexerChannelEndpoint: string
  sourceIndexerAirnodeEndpoint: string

  targetIndexerEndpoint: string
  targetIndexerOracleEndpoint: string
  targetIndexerRelayerEndpoint: string
  targetIndexerChannelEndpoint: string
  targetIndexerAirnodeEndpoint: string
}

export interface StartInput {
  task: StartTask
}
