import {logger} from "@darwinia/ormpipe-logger";
import {OracleLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexerAirnode, ThegraphIndexerOracle, ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {AirnodeContractClient} from "../client/contract_airnode";
import * as asyncx from "async";

export class OracleRelay extends CommonRelay<OracleLifecycle> {

  constructor(lifecycle: OracleLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerOracle(): ThegraphIndexerOracle {
    return super.lifecycle.sourceIndexerOracle
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

  public get targetAirnodeClient(): AirnodeContractClient {
    return super.lifecycle.targetAirnodeClient
  }

  public async start() {
    try {
      const rets = await asyncx.parallel({
        delivery: callback => this.delivery(),
        aggregate: callback => this.aggregate(),
      });
      console.log(rets);
    } catch (e: any) {
      logger.error(e, super.meta('oracle'));
    }
  }

  private async delivery() {
    // delivery start block
    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('oracle', ['delivery'])
    );
    const targetLastMessageDispatched = await this.targetIndexerOrmp.lastMessageDispatched();
    // todo: check running block
    const queryNextMessageAndOracleFromBlockNumber = +(targetLastMessageDispatched?.blockNumber ?? 0);
    logger.debug(
      `queried next oracle from block number %s(%s)`,
      queryNextMessageAndOracleFromBlockNumber,
      super.sourceName,
      super.meta('oracle', ['delivery'])
    );

    logger.debug('start oracle deliver', super.meta('oracle', ['delivery']));
    const sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextMessageAccepted({
      blockNumber: queryNextMessageAndOracleFromBlockNumber,
    });
    if (!sourceNextMessageAccepted) {
      logger.info('not have more message accepted', super.meta('oracle', ['delivery']));
      return;
    }
    const sourceNextOracleAssigned = await this.sourceIndexerOracle.nextAssigned({
      blockNumber: queryNextMessageAndOracleFromBlockNumber,
    });
    if (!sourceNextOracleAssigned || sourceNextMessageAccepted.msgHash !== sourceNextOracleAssigned.msgHash) {
      logger.info(
        `new message accepted but not assigned to myself. %s`,
        sourceNextMessageAccepted.msgHash,
        super.meta('oracle', ['delivery'])
      );
      return;
    }
    logger.info(
      `new message accepted %s wait block %s(%s) finalized`,
      sourceNextMessageAccepted.msgHash,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('oracle', ['delivery'])
    );

    const sourceFinalizedBLock = await this.sourceClient.evm.getBlock('finalized', false);
    if (!sourceFinalizedBLock) {
      logger.error(
        'can not get %s finalized block',
        super.sourceName,
        super.meta('oracle', ['delivery']),
      );
      return;
    }
    if (sourceFinalizedBLock.number < +(sourceNextMessageAccepted.blockNumber)) {
      logger.warn(
        'message block not finalized %s/%s(%s)',
        sourceNextMessageAccepted.blockNumber,
        sourceFinalizedBLock.number,
        super.sourceName,
        super.meta('oracle', ['delivery']),
      )
      return;
    }
    logger.debug(
      'message block finalized %s/%s(%s)',
      sourceNextMessageAccepted.blockNumber,
      sourceFinalizedBLock.number,
      super.sourceName,
      super.meta('oracle', ['delivery']),
    );

    const beacons = await this.targetIndexerAirnode.beacons();
    logger.debug(
      'queried %s beacons from %s airnode-dapi contract',
      beacons.length,
      super.targetName,
      super.meta('oracle', ['delivery']),
    );

    logger.warn('==== TODO: requestFinalizedHash =====', super.meta('oracle', ['delivery']));
    await this.targetAirnodeClient.requestFinalizedHash();
    logger.info(
      'called %s airnode contract requestFinalizedHash, wait aggregate',
      super.targetName,
      super.meta('oracle', ['delivery']),
    );
  }

  private async aggregate() {
    logger.debug('start oracle aggregate', super.meta('oracle', ['aggregate']));

    const beacons = await this.targetIndexerAirnode.beacons();
    const countBeacons = beacons.length;
    logger.debug(
      'queried %s beacons from %s airnode-dapi contract',
      countBeacons,
      super.targetName,
      super.meta('oracle', ['aggregate']),
    );

    const beaconIds = beacons.map(item => item.beaconId);
    const distruibutions = await this.targetIndexerAirnode.beaconAirnodeCompletedDistribution(beaconIds);
    if (!distruibutions.length) {
      logger.warn(
        'not have anymore airnode completed events from %s',
        super.targetName,
        super.meta('oracle', ['aggregate']),
      );
      return;
    }

    const initCountData: Record<string, number> = {};
    const countDistruibution = distruibutions.reduce((reto, value) => {
      return {
        ...reto,
        [value.data]: (reto[value.data] || 0) + 1
      }
    }, initCountData);
    const twoThirds = countBeacons * (2 / 3);
    const completedDatas = Object.keys(countDistruibution)
      .filter(key => countDistruibution[key] >= twoThirds)
      .map(key => key);

    if (!completedDatas.length) {
      logger.debug(
        'no more completed data to aggregated beacons to %s',
        super.targetName,
        super.meta('oracle', ['aggregate']),
      );
      return;
    }
    const completedData = completedDatas[0];

    const aggregateBeaconIds = distruibutions
      .filter(item => item.data == completedData)
      .map(item => item.beaconId);
    logger.debug(
      'aggregate beacons %s to %s airnode-api contract',
      super.targetName,
      JSON.stringify(aggregateBeaconIds),
      super.meta('oracle', ['aggregate']),
    );
    logger.warn('==== TODO: aggregateBeacons =====', super.meta('oracle', ['aggregate']));
    await this.targetAirnodeClient.aggregateBeacons(aggregateBeaconIds);

  }

}
