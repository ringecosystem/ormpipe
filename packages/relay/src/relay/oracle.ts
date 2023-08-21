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
      const message = e.message;
      logger.error(message, {target: 'oracle', breads: ['source>target']});
    }
  }

  private async run() {
    const nextOracleAssigned = await this.lifecycle.sourceIndexerOracle
      .thegraph().oracle()
      .nextAssigned({blockNumber: 0});
    console.log(JSON.stringify(nextOracleAssigned));
  }

}
