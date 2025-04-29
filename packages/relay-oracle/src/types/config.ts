import {
  CliBaseConfig,
  RelayBaseConfig,
  RelayBaseLifecycle,
  RelayEVMClient,
} from "@darwinia/ormpipe-common";
import { SqdIndexOrmp, SqdIndexSigncribe } from "@darwinia/ormpipe-indexer";

export type CliOracleConfig = CliBaseConfig;

export interface OracleRelayConfig extends RelayBaseConfig {
  mainly: boolean | undefined;
}

export interface OracleRelayLifecycle extends RelayBaseLifecycle {
  signcribeClient: RelayEVMClient;
  sourceIndexerOrmp: SqdIndexOrmp;
  targetIndexerOrmp: SqdIndexOrmp;
  indexerSigncribe: SqdIndexSigncribe;
  mainly: boolean;
}
