export interface _QueryWithBlockNumber {
  blockNumber: number
}

export interface QueryGraph {
  query: string
  variables?: Record<string, any>
}

export interface QueryBeacons {
  chainId: number
}

export interface QueryLastAggregatedMessageRoot {
  chainId: number
}

export interface QueryNextRelayerAssigned {
  msgHash: string
}

export interface QueryPreparedMessages {
  messageIndex: number
}

export interface QueryNextMessageAccepted {
  messageIndex: number
  toChainId: number
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

export interface QueryAirnodeCompletedDistribution {
  beacons: string[]
}

export interface QueryOrmpProtocolMessageAccepted {
  msgHash?: string
  root?: string
  messageIndex?: number
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
  message_gasLimit: string
}

export interface OrmpMessageDispatched extends BaseGraphEntity {
  msgHash: string
  dispatchResult: string
}

export interface SubapiBeaconBase extends BaseGraphEntity {
  chainId: string
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
  chainId: number
  ormpData_root: string
  ormpData_count: string
}
