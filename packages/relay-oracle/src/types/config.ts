import {
  ChainInfoFlag,
  CliBaseConfig,
  RelayBaseConfig,
  RelayBaseLifecycle,
  RelayEVMClient
} from "@darwinia/ormpipe-common";
import {ThegraphIndexOracle, ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {ThegraphIndexSigncribe} from "@darwinia/ormpipe-indexer/dist/thegraph/signcribe";


export interface CliOracleConfig extends CliBaseConfig {
}

export interface OracleRelayConfig extends RelayBaseConfig {
  mainly: boolean,
}

export interface OracleRelayLifecycle extends RelayBaseLifecycle {
  signcribeClient: RelayEVMClient
  sourceIndexerOrmp: ThegraphIndexOrmp
  targetIndexerOrmp: ThegraphIndexOrmp
  sourceIndexOracle: ThegraphIndexOracle
  targetIndexOracle: ThegraphIndexOracle
  indexerSigncribe: ThegraphIndexSigncribe
  mainly: boolean
}
