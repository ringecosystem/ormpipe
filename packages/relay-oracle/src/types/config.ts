import {
  CliBaseConfig,
  RelayBaseConfig,
  RelayBaseLifecycle,
  RelayEVMClient
} from "@darwinia/ormpipe-common";
import {PonderIndexOrmp, PonderIndexSigncribe} from "@darwinia/ormpipe-indexer";


export type CliOracleConfig = CliBaseConfig

export interface OracleRelayConfig extends RelayBaseConfig {
  mainly: boolean | undefined
}

export interface OracleRelayLifecycle extends RelayBaseLifecycle {
  signcribeClient: RelayEVMClient
  sourceIndexerOrmp: PonderIndexOrmp
  targetIndexerOrmp: PonderIndexOrmp
  indexerSigncribe: PonderIndexSigncribe
  mainly: boolean
}
