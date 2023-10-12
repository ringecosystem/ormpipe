export interface _QueryWithBlockNumber {
  blockNumber: number
}

export interface QueryGraph {
  query: string
  variables?: Record<string, any>
}

export interface QueryNextRelayerAssigned {
  msgHash: string
}

export interface QueryNextMessageAccepted {
  messageIndex: number
}

export interface QueryNextUndoMessageAccepted {
  msgHashes: string[]
}

export interface QueryNextAirnodeCompleted {
  beaconId: string
}

export interface QueryChannelMessageAccepted {
  msgHash?: string
  root?: string
}


export type QueryNextOracleAssigned = QueryNextRelayerAssigned

export interface IGraphResponse<T> {
  data: T
}

export interface BaseGraphEntity {
  id: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export interface OrmpOracleAssigned extends BaseGraphEntity {
  msgHash: string
  fee: number
}

export interface OrmpRelayerAssigned extends OrmpOracleAssigned {
  params: string
}

export interface OrmpMessageAccepted extends BaseGraphEntity {
  msgHash: string
  root: string
  message_channel: string
  message_index: string
  message_fromChainId: string
  message_from: string
  message_toChainId: string
  message_to: string
  message_encoded: string
}

export interface OrmpChannelMessageDispatched extends BaseGraphEntity {
  msgHash: string
  dispatchResult: string
}

export interface AirnodeBeaconBase extends BaseGraphEntity {
  beaconId: string
}

export interface AirnodeBeacon extends AirnodeBeaconBase {
  beacon_airnode: string
  beacon_endpointId: string
  beacon_sponsor: string
  beacon_sponsorWallet: string
}

export interface AirnodeComplted extends AirnodeBeaconBase {
  requestId: string
  data: string
}

export interface AirnodeBeaconCompletedDistruibution {
  beaconId: string
  data: string
}

export interface AirnodeAggregatedMessageRoot {
  msgRoot: string
}
