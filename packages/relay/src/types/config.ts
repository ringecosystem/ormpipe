export enum StartTask {
  oracle = 'oracle',
  relayer = 'relayer',
}

export enum RelayFeature {
  oracle_delivery = 'oracle.delivery',
  oracle_aggregate = 'oracle.aggregate',
}

export interface CliStartConfig {
  tasks: StartTask[]
  features: RelayFeature[]
  dataPath: string
  config: string
  enablePair: string[]
  signer: string
}

export interface ChainInfoFlag {
  name: string
  endpoint: string
  indexer: string
  contract: ChainInfoFlagContract
}

export interface ChainInfoFlagContract {
  subapi: string
  relayer: string
}

export interface OrmpRelayConfig {
  tasks: StartTask[]
  features: RelayFeature[]
  enablePair: string[]
  dataPath: string

  chain: Record<string, ChainInfoFlag>,

  signer: string
}

export interface OrmpRelayStartInput {
  task: StartTask
  features: RelayFeature[]
  dataPath: string
  signer: string
  source: ChainInfoFlag
  target: ChainInfoFlag
}

