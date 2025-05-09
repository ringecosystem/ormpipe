import {
  ChainInfoFlag,
  CliBaseConfig,
  RelayBaseConfig,
  RelayBaseLifecycle,
} from "@darwinia/ormpipe-common";
import { SqdIndexOrmp } from "@darwinia/ormpipe-indexer";

export type CliRelayerConfig = CliBaseConfig;

export type RelayerRelayConfig = RelayBaseConfig;

export interface RelayerRelayLifecycle extends RelayBaseLifecycle {
  sourceIndexerOrmp: SqdIndexOrmp;
  targetIndexerOrmp: SqdIndexOrmp;
}
