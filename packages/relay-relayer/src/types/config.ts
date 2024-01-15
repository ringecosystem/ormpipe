import {ChainInfoFlag, CliBaseConfig, RelayBaseConfig, RelayBaseLifecycle} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp, ThegraphIndexOracle} from "@darwinia/ormpipe-indexer";


export interface CliRelayerConfig extends CliBaseConfig {
}

export interface RelayerRelayConfig extends RelayBaseConfig {
}

export interface RelayerRelayLifecycle extends RelayBaseLifecycle {
  sourceIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerOracle: ThegraphIndexOracle,
}
