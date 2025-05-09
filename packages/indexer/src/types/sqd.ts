import { BaseGraphEntity } from "./graphql"


export interface OrmpOracleAssigned extends BaseGraphEntity {
  msgHash: string
  fee: number
}

export interface OrmpRelayerAssigned extends OrmpOracleAssigned {
  params: string
}

export interface OrmpMessageAccepted extends BaseGraphEntity {
  msgHash: string
  channel: string
  index: string
  fromChainId: string
  from: string
  toChainId: string
  to: string
  encoded: string
  gasLimit: string
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

export interface OracleImportedMessageHash extends BaseGraphEntity {
  msgIndex: string;
  srcChainId: string;
  hash: string;
}

export interface OrmpMessageDispatched extends BaseGraphEntity {
  msgHash: string;
  dispatchResult: string;
}
