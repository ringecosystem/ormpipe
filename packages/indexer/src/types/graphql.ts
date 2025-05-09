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

export interface QueryWithFromTo {
  fromChainId: number
  toChainId: number
}

export type QueryLastImportedMessageHash = QueryWithFromTo

export interface QueryNextRelayerAssigned {
  msgHash: string
}

export interface QueryBasicMessageAccepted {
  fromChainId: number
  toChainId: number
}

export interface QueryRelayerMessageAccepted extends QueryBasicMessageAccepted {
  messageIndex: number
}

export interface QueryNextMessageAccepted extends QueryBasicMessageAccepted {
  messageIndex: number
}

export interface QueryMessageAcceptedListByHashes extends QueryWithChainId {
  msgHashes: string[]
}

export interface QueryMessageHashes extends QueryWithChainId {
  messageIndex: number
}

export interface QueryOrmpProtocolMessageAccepted extends QueryWithChainId {
  msgHash?: string
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
  errors: any[]
}

export interface BaseGraphEntity {
  id: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

