import {
  ThegraphIndexChannel, ThegraphIndexerAirnode,
  ThegraphIndexerOracle,
  ThegraphIndexerRelayer
} from "@darwinia/ormpipe-indexer";
import {ethers} from "ethers";
import {RelayDirection} from "./mark";

export interface BaseLifecycle {
  direction: RelayDirection,
  sourceName: string,
  targetName: string,
  sourceClient: ethers.JsonRpcProvider,
  targetClient: ethers.JsonRpcProvider,
}

export interface OracleLifecycle extends BaseLifecycle {
  sourceIndexerOracle: ThegraphIndexerOracle,
  sourceIndexerChannel: ThegraphIndexChannel,
  targetIndexerChannel: ThegraphIndexChannel,
  targetIndexerAirnode: ThegraphIndexerAirnode,
}

export interface RelayerLifecycle extends BaseLifecycle {
  sourceIndexerRelayer: ThegraphIndexerRelayer,
  sourceIndexerChannel: ThegraphIndexChannel,
  targetIndexerChannel: ThegraphIndexChannel,
  targetIndexerAirnode: ThegraphIndexerAirnode,
}
