import {ChainInfoFlag, CliBaseConfig, RelayBaseConfig, RelayBaseLifecycle} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp, ThegraphIndexOracle} from "@darwinia/ormpipe-indexer";


export type CliRelayerConfig = CliBaseConfig

export type RelayerRelayConfig = RelayBaseConfig

export interface RelayerRelayLifecycle extends RelayBaseLifecycle {
  sourceIndexerOrmp: ThegraphIndexOrmp
  targetIndexerOrmp: ThegraphIndexOrmp
  sourceIndexerOracle: ThegraphIndexOracle
  targetIndexerOracle: ThegraphIndexOracle
}
