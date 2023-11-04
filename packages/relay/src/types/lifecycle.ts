import {
  ThegraphIndexOrmp,
  ThegraphIndexerSubapi,
  ThegraphIndexerOracle,
  ThegraphIndexerRelayer
} from "@darwinia/ormpipe-indexer";
import {RelayDirection} from "./mark";
import {RelayClient} from "../client";
import {SubapiContractClient} from "../client/contract_subapi";
import {RelayerContractClient} from "../client/contract_relayer";
import {RelayStorage} from "../helper/storage";

export interface BaseLifecycle {
  storage: RelayStorage,
  direction: RelayDirection,
  sourceName: string,
  targetName: string,
  sourceClient: RelayClient,
  targetClient: RelayClient,
}

export interface OracleLifecycle extends BaseLifecycle {
  sourceIndexerOracle: ThegraphIndexerOracle,
  sourceIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerSubapi: ThegraphIndexerSubapi,
  targetSubapiClient: SubapiContractClient,
}

export interface RelayerLifecycle extends BaseLifecycle {
  sourceIndexerRelayer: ThegraphIndexerRelayer,
  sourceIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerOrmp: ThegraphIndexOrmp,
  targetIndexerSubapi: ThegraphIndexerSubapi,
  sourceRelayerClient: RelayerContractClient,
  targetRelayerClient: RelayerContractClient,
}
