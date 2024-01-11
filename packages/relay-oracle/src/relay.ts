import {OracleRelayLifecycle} from "./types/config";
import {CommonRelay} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";

export class OracleRelay extends CommonRelay<OracleRelayLifecycle> {

  constructor(lifecycle: OracleRelayLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp
  }

  public get targetIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.targetIndexerOrmp
  }


  public async start() {
    console.log(this.lifecycle);
  }

}
