import {
  ThegraphIndexChannel,
  ThegraphIndexerAirnode,
  ThegraphIndexerOracle,
  ThegraphIndexerRelayer
} from "@darwinia/ormpipe-indexer";
import {RelayDirection} from "./mark";
import {RelayClient} from "../client";

export interface BaseLifecycle {
  direction: RelayDirection,
  sourceName: string,
  targetName: string,
  sourceClient: RelayClient,
  targetClient: RelayClient,
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
