import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {ethers} from "ethers";

export interface BaseLifecycle {
  sourceClient: ethers.JsonRpcProvider,
  targetClient: ethers.JsonRpcProvider,
}

export interface OracleLifecycle extends BaseLifecycle {
  sourceIndexerOracle: OrmpipeIndexer,
}

export interface RelayerLifecycle extends BaseLifecycle {
  sourceIndexerRelayer: OrmpipeIndexer,
}
