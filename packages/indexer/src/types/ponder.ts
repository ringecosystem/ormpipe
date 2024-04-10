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
  
  export type QueryLastImportedMessageRoot = QueryWithChainId;
  
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
  
  export interface QueryMessageAcceptedListByHashes {
    msgHashes: string[]
  }
  
  export interface QueryMessageHashes {
    messageIndex: number
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
    messageChannel: string
    messageIndex: string
    messageFromChainId: string
    messageFrom: string
    messageToChainId: string
    messageTo: string
    messageEncoded: string
    messageGasLimit: string
    logIndex: string
  
    oracleAssigned?: string
    oracleAssignedFee?: string
    oracleLogIndex?: string
    relayerAssigned?: string
    relayerAssignedFee?: string
    relayerLogIndex?: string
  }
  
  export interface OrmpMessageDispatched extends BaseGraphEntity {
    msgHash: string
    dispatchResult: string
  }
  
  export interface SignatureSubmittion extends BaseGraphEntity {
    chainId: string
    msgIndex: string
    channel: string
    signer: string
    signature: string
    data: string
  }
  
  export interface OracleImportedMessageRoot extends BaseGraphEntity {
    srcChainId: string
    srcBlockNumber: string
    hash: string
  }
  