import {Vendor} from "./marks";

export interface IndexerHttpConfig {
  endpoint: string;
  timeout?: number;
}

export type IndexerInput = IndexerHttpConfig
