import {Vendor} from "./marks";

export interface IndexerHttpConfig {
  endpoint: string;
  timeout: number;
}

export interface IndexerInput extends IndexerHttpConfig{
  vendor: Vendor;
}
