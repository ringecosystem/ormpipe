import {Vendor} from "./marks";

export interface IndexerHttpConfig {
  timeout?: number;
}

export interface IndexerInput extends IndexerHttpConfig {
  endpoint: string;
  oracleEndpoint?: string
  relayerEndpoint?: string
  ormpEndpoint?: string
  airnodeEndpoint?: string
}
