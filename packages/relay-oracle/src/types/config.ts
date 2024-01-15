import {ChainInfoFlag, CliBaseConfig, RelayBaseConfig, RelayBaseLifecycle} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {ThegraphIndexSigncribe} from "@darwinia/ormpipe-indexer/dist/thegraph/signcribe";


export interface CliOracleConfig extends CliBaseConfig {
}

export interface OracleRelayConfig extends RelayBaseConfig {
  mainly: boolean,
}

export interface OracleRelayLifecycle extends RelayBaseLifecycle {
  sourceIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerOrmp: ThegraphIndexOrmp,
  indexerSigncribe: ThegraphIndexSigncribe,
  mainly: boolean,
}
