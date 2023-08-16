

export interface _QueryWithBlockNumber {
  blockNumber: number
}

export interface QueryGraph {
  query: string
  variables?: Record<string, any>
}

export type QueryNextOracleAssigned = _QueryWithBlockNumber


