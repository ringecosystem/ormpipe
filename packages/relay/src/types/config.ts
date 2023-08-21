
export enum StartTask {
  oracle = 'oracle',
  relayer = 'relayer',
}

export interface RelayConfig {
  sourceName: string
  sourceEndpoint: string
  targetName: string
  targetEndpoint: string
  sourceIndexerOracleEndpoint: string,
  sourceIndexerRelayerEndpoint: string,
  // indexerEndpoint: string
  // indexerOracleEndpoint: string
  // indexerRelayerEndpoint: string
}

export interface StartInput {
  task: StartTask
}
