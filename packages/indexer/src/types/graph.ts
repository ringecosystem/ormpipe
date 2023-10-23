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

export interface QueryPreparedMessages {
  messageIndex: number
}

export interface QueryNextMessageAccepted {
  messageIndex: number
}

export interface QueryNextUndoMessageAccepted {
  unrealyeds: OrmpMessageDispatched[]
}

export interface QueryOtherThanDispatchedList {
  msgHashes: string[]
}

export interface QueryMessageAcceptedListByHashes {
  msgHashes: string[]
}

export interface QueryMessageHashes {
  messageIndex: number
}

export interface QueryNextAirnodeCompleted {
  beaconId: string
}

export interface QueryChannelMessageAccepted {
  msgHash?: string
  root?: string
}

export interface QueryInspectMessageDispatched {
  msgHash: string
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

export interface OrmpMessageDispatched extends BaseGraphEntity {
  msgHash: string
  dispatchResult: string
}

export interface SubapiBeaconBase extends BaseGraphEntity {
  beaconId: string
}

export interface SubapiBeacon extends SubapiBeaconBase {
  beacon_airnode: string
  beacon_endpointId: string
  beacon_sponsor: string
  beacon_sponsorWallet: string
}

export interface AirnodeComplted extends SubapiBeaconBase {
  requestId: string
  data: string
}

export interface AirnodeBeaconCompletedDistruibution {
  beaconId: string
  data: string
}

export interface AirnodeAggregatedMessageRoot {
  ormpData_root: string
  ormpData_count: string
}
