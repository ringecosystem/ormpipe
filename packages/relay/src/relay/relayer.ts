import {RelayerLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexOrmp, ThegraphIndexerAirnode, ThegraphIndexerRelayer} from "@darwinia/ormpipe-indexer";

export class RelayerRelay extends CommonRelay<RelayerLifecycle> {

  constructor(lifecycle: RelayerLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerRelayer(): ThegraphIndexerRelayer {
    return super.lifecycle.sourceIndexerRelayer
  }

  public get sourceIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp
  }

  public get targetIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.targetIndexerOrmp
  }

  public get targetIndexerAirnode(): ThegraphIndexerAirnode {
    return super.lifecycle.targetIndexerAirnode
  }

  public async start() {
    // start relayer relay
  }

}
