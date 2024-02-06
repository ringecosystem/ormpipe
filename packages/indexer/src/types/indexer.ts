export interface IndexerHttpConfig {
  timeout?: number;
}

export interface IndexerInput extends IndexerHttpConfig {
  endpoint: string;
  ormpEndpoint?: string
  signcribeEndpoint?: string
  oracleEndpoint?: string
}
