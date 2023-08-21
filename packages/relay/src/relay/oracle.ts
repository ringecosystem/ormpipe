import {logger} from "@darwinia/ormpipe-logger";
import {OracleLifecycle} from "../types/lifecycle";

export class OracleRealy {

  constructor(
    private readonly lifecycle: OracleLifecycle,
  ) {
  }

  public async start() {
    try {
      await this.run();
    } catch (e: any) {
      logger.error(e, {target: 'oracle', breads: ['source>target']});
    }
  }

  private async run() {
    const nextMessageAccepted = await this.lifecycle.sourceIndexerOracle
      .thegraph()
      .channel()
      .nextMessageAccepted({blockNumber: 0});
    const nextOracleAssigned = await this.lifecycle.sourceIndexerOracle
      .thegraph()
      .oracle()
      .nextAssigned({blockNumber: 0});
    console.log(JSON.stringify(nextOracleAssigned));
  }

}
