import {logger} from "@darwinia/ormpipe-logger";
import {OracleLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexerAirnode, ThegraphIndexerOracle, ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {AirnodeContractClient} from "../client/contract_airnode";
import * as asyncx from "async";
import {RelayFeature} from "../types/config";
import chalk = require('chalk');

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

  public async start(features: RelayFeature[]) {
    try {
      await asyncx.series({
        delivery: callback => {
          if (features.indexOf(RelayFeature.oracle_delivery) != -1) {
            this.delivery()
              .then(() => callback(null))
              .catch(e => callback(e));
          } else {
            callback(null)
          }
        },
        aggregate: callback => {
          if (features.indexOf(RelayFeature.oracle_aggregate) != -1) {
            this.aggregate()
              .then(() => callback(null))
              .catch(e => callback(e));
          } else {
            callback(null);
          }
        },
      })
    } catch (e: any) {
      logger.error(e, super.meta('oracle'));
    }
  }

  private async delivery() {
    logger.debug('start oracle delivery', super.meta('oracle', ['delivery']));
    // delivery start block
    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('oracle', ['delivery'])
    );
    // todo: check running block
    let queryNextMessageIndexStart = 0;
    let sourceMessageIndexAtBlock = 0;
    const targetLastMessageDispatched = await this.targetIndexerOrmp.lastMessageDispatched();
    if (targetLastMessageDispatched) {
      const sourceChainLastDispatched = await this.sourceIndexerOrmp.inspectMessageAccepted({
        msgHash: targetLastMessageDispatched.msgHash,
      });
      if (sourceChainLastDispatched) {
        queryNextMessageIndexStart = +sourceChainLastDispatched.message_index;
        sourceMessageIndexAtBlock = +sourceChainLastDispatched.blockNumber;
      }
    }
    logger.debug(
      `queried next oracle from message %s at block number %s(%s)`,
      queryNextMessageIndexStart,
      sourceMessageIndexAtBlock,
      super.sourceName,
      super.meta('oracle', ['delivery'])
    );

    const sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextMessageAccepted({
      messageIndex: queryNextMessageIndexStart,
    });
    if (!sourceNextMessageAccepted) {
      logger.info('not have more message accepted', super.meta('oracle', ['delivery']));
      return;
    }
    const sourceNextOracleAssigned = await this.sourceIndexerOracle.nextAssigned({
      msgHash: sourceNextMessageAccepted.msgHash,
    });
    if (!sourceNextOracleAssigned) {
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
      'queried %s beacons from %s airnode-dapi contract, prepare to call %s (requestFinalizedHash)',
      beacons.length,
      super.targetName,
      super.targetName,
      super.meta('oracle', ['delivery']),
    );

    const targetTxRequestFinalizedHash = await this.targetAirnodeClient.requestFinalizedHash(beacons);
    logger.info(
      'called %s airnode contract requestFinalizedHash {tx: %s, block: %s}, wait aggregate',
      super.targetName,
      chalk.magenta(targetTxRequestFinalizedHash.hash),
      chalk.cyan(targetTxRequestFinalizedHash.blockNumber),
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

    const lastAggregatedMessageRoot = await this.targetIndexerAirnode.lastAggregatedMessageRoot();
    if (lastAggregatedMessageRoot) {
      if (lastAggregatedMessageRoot.msgRoot === completedData) {
        logger.warn(
          'the message root %s already aggregated',
          super.targetName,
          super.meta('oracle', ['aggregate']),
        );
        return;
      }
    }

    const aggregateBeaconIds = distruibutions
      .filter(item => item.data == completedData)
      .map(item => item.beaconId);
    logger.debug(
      'aggregate beacons %s to %s airnode-api contract',
      super.targetName,
      JSON.stringify(aggregateBeaconIds),
      super.meta('oracle', ['aggregate']),
    );

    const targetTxAggregateBeacons = await this.targetAirnodeClient.aggregateBeacons(aggregateBeaconIds);
    logger.info(
      'aggreated beacons to %s airnode-api contract {tx: %s, block: %s}',
      super.targetName,
      chalk.magenta(targetTxAggregateBeacons.hash),
      chalk.cyan(targetTxAggregateBeacons.blockNumber),
      super.meta('oracle', ['aggregate']),
    );
  }

}
