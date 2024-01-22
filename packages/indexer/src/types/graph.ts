export interface _QueryWithBlockNumber {
  blockNumber: number
}

export interface QueryGraph {
  query: string
  variables?: Record<string, any>
}

export interface QueryWithChainId {
  chainId: number
}

export type QueryBeacons = QueryWithChainId;
export type QueryLastImportedMessageRoot = QueryWithChainId;

export interface QueryNextRelayerAssigned {
  msgHash: string
}

export interface QueryBasicMessageAccepted {
  toChainId: number
}

export interface QueryRelayerMessageAccepted extends QueryBasicMessageAccepted {
  messageIndex: number
}

export interface QueryNextMessageAccepted extends QueryBasicMessageAccepted {
  messageIndex: number
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

export interface QueryTopSigncribe extends QueryWithChainId {
  signers: string[]
  msgIndex: number
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

  oracleAssigned?: string
  oracleAssignedFee?: string
  relayerAssigned?: string
  relayerAssignedFee?: string
  relayerAssignedProof?: string
  relayerAssignedParams?: string
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

export interface SignatureSubmittion extends BaseGraphEntity {
  chainId: string
  signer: string
  signature: string
  data: string
}

// export interface AirnodeComplted extends SubapiBeaconBase {
//   requestId: string
//   data: string
// }
//
// export interface AirnodeBeaconCompletedDistruibution {
//   beaconId: string
//   data: string
// }
//
// export interface AirnodeAggregatedMessageRoot {
//   chainId: number
//   ormpData_root: string
//   ormpData_count: string
// }

export interface OracleImportedMessageRoot extends BaseGraphEntity {
  chainId: string
  blockHeight: string
  messageRoot: string
}
