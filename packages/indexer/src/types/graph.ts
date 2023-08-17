

export interface _QueryWithBlockNumber {
  blockNumber: number
}

export interface QueryGraph {
  query: string
  variables?: Record<string, any>
}

export type QueryNextOracleAssigned = _QueryWithBlockNumber
export type QueryNextRelayerAssigned = _QueryWithBlockNumber

export interface IGraphResponse<T> {
  data: T
}

export interface OrmpOracleAssigned {
  id: string
  msgHash: string
  fee: number
  blockNumber: number
  blockTimestamp: number
  transactionHash: string
}

export interface OrmpRelayerAssigned extends OrmpOracleAssigned {
  parmas: string
}


