import {RelayerLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";

export class RelayerRelay extends CommonRelay<RelayerLifecycle> {

  constructor(lifecycle: RelayerLifecycle) {
    super(lifecycle);
  }

  public async start() {
    // start relayer relay
  }

}
