import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {ethers} from "ethers";


export interface OracleLifecycle {
  sourceIndexerOracle: OrmpipeIndexer,
  sourceClient: ethers.JsonRpcProvider,
  targetClient: ethers.JsonRpcProvider,
}

export interface RelayerLifecycle {
  sourceIndexerRelayer: OrmpipeIndexer,
  sourceClient: ethers.JsonRpcProvider,
  targetClient: ethers.JsonRpcProvider,
}
