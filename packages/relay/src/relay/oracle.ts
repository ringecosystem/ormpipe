import {logger} from "@darwinia/ormpipe-logger";
import {OracleLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexChannel, ThegraphIndexerAirnode, ThegraphIndexerOracle} from "@darwinia/ormpipe-indexer";

export class OracleRelay extends CommonRelay<OracleLifecycle> {

  constructor(lifecycle: OracleLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerOracle(): ThegraphIndexerOracle {
    return super.lifecycle.sourceIndexerOracle
  }

  public get sourceIndexerChannel(): ThegraphIndexChannel {
    return super.lifecycle.sourceIndexerChannel
  }

  public get targetIndexerChannel(): ThegraphIndexChannel {
    return super.lifecycle.targetIndexerChannel
  }

  public get targetIndexerAirnode(): ThegraphIndexerAirnode {
    return super.lifecycle.targetIndexerAirnode
  }

  public async start() {
    try {
      await this.run();
    } catch (e: any) {
      logger.error(e, super.meta({target: 'oracle'}));
    }
  }

  private async run() {

    logger.debug(`query last message dispatched from ${super.targetName} indexer-channel`, super.meta({target: 'oracle'}));
    const targetLastMessageDispatched = await this.targetIndexerChannel.lastMessageDispatched();
    // todo: check running block
    const queryNextMessageAndOracleFromBlockNumber = +(targetLastMessageDispatched?.blockNumber ?? 0);
    logger.debug(`queried next oracle from block number ${queryNextMessageAndOracleFromBlockNumber}`, super.meta({target: 'oracle'}));

    const sourceNextMessageAccepted = await this.sourceIndexerChannel.nextMessageAccepted({
      blockNumber: queryNextMessageAndOracleFromBlockNumber
    });
    const sourceNextOracleAssigned = await this.sourceIndexerOracle.nextAssigned({
      blockNumber: queryNextMessageAndOracleFromBlockNumber
    });

    console.log(JSON.stringify(sourceNextMessageAccepted));
    console.log(JSON.stringify(sourceNextOracleAssigned));
  }

}
