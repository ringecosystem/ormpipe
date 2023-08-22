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
    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel`,
      super.meta({target: 'oracle'})
    );
    const targetLastMessageDispatched = await this.targetIndexerChannel.lastMessageDispatched();
    // todo: check running block
    const queryNextMessageAndOracleFromBlockNumber = +(targetLastMessageDispatched?.blockNumber ?? 0);
    logger.debug(
      `queried next oracle from block number %s`,
      queryNextMessageAndOracleFromBlockNumber,
      super.meta({target: 'oracle'})
    );

    const sourceNextMessageAccepted = await this.sourceIndexerChannel.nextMessageAccepted({
      blockNumber: queryNextMessageAndOracleFromBlockNumber
    });
    if (!sourceNextMessageAccepted) {
      logger.info('not have more message accepted', super.meta({target: 'oracle'}));
      return;
    }
    const sourceNextOracleAssigned = await this.sourceIndexerOracle.nextAssigned({
      blockNumber: queryNextMessageAndOracleFromBlockNumber
    });
    if (!sourceNextOracleAssigned || sourceNextMessageAccepted.msgHash !== sourceNextOracleAssigned.msgHash) {
      logger.info(
        `new message accepted but not assigned to myself. %s`,
        sourceNextMessageAccepted.msgHash,
        super.meta({target: 'oracle'})
      );
      return;
    }
    logger.info(
      `new message accepted %s wait block %s(%s) finalized`,
      sourceNextMessageAccepted.msgHash,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta({target: 'oracle'})
    );

    const sourceFinalizedBLock = await this.sourceClient.getBlock('finalized', false);
    if (!sourceFinalizedBLock) {
      logger.error(
        'can not get %s finalized block',
        super.sourceName,
        super.meta({target: 'oracle'}),
      );
      return;
    }
    if (sourceFinalizedBLock.number < +(sourceNextMessageAccepted.blockNumber)) {
      logger.warn(
        'message block not finalized %s/%s(%s)',
        sourceNextMessageAccepted.blockNumber,
        sourceFinalizedBLock.number,
        super.sourceName,
        super.meta({target: 'oracle'}),
      )
      return;
    }
    logger.debug(
      'message block finalized %s/%s(%s)',
      sourceNextMessageAccepted.blockNumber,
      sourceFinalizedBLock.number,
      super.sourceName,
      super.meta({target: 'oracle'}),
    );

    const beacons = await this.targetIndexerAirnode.beacons();
    logger.debug(
      'queried %s beacons from %s airnode-dapi contract',
      beacons.length,
      super.targetName,
      super.meta({target: 'oracle'}),
    );

    console.log(JSON.stringify(beacons));
  }

}
