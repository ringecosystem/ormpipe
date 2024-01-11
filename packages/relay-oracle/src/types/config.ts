import {ChainInfoFlag, CliBaseConfig, RelayBaseConfig, RelayBaseLifecycle} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";


export interface CliOracleConfig extends CliBaseConfig {
}

export interface OracleRelayConfig extends RelayBaseConfig {
}

export interface OracleRelayLifecycle extends RelayBaseLifecycle {
  sourceIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerOrmp: ThegraphIndexOrmp,
}
