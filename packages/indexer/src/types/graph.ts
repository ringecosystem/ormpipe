

export interface _QueryWithBlockNumber {
  blockNumber: number
}

export interface QueryGraph {
  query: string
  variables?: Record<string, any>
}

export type QueryNextOracleAssigned = _QueryWithBlockNumber
export type QueryNextRelayerAssigned = _QueryWithBlockNumber
export type QueryNextChannelMessagAccepted = _QueryWithBlockNumber

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
  parmas: string
}

export interface OrmpChannelMessageAccepted extends BaseGraphEntity {
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

