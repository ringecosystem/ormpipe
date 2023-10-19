import {logger} from "@darwinia/ormpipe-logger";
import {OracleLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {
  OrmpMessageAccepted,
  ThegraphIndexerSubapi,
  ThegraphIndexerOracle,
  ThegraphIndexOrmp
} from "@darwinia/ormpipe-indexer";
import {SubapiContractClient} from "../client/contract_subapi";
import * as asyncx from "async";
import {RelayFeature} from "../types/config";
import chalk = require('chalk');

export class OracleRelay extends CommonRelay<OracleLifecycle> {

  private static CK_ORACLE_DELIVERIED: string = 'ormpipe.oracle.deliveried';
  private static CK_ORACLE_AGGREGATED: string = 'ormpipe.oracle.aggregated';

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

  public get targetIndexerSubapi(): ThegraphIndexerSubapi {
    return super.lifecycle.targetIndexerSubapi
  }

  public get targetSubapiClient(): SubapiContractClient {
    return super.lifecycle.targetSubapiClient
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
      logger.error(e, super.meta('ormpipe-relay'));
    }
  }

  private async _lastAssignedMessageAccepted(): Promise<OrmpMessageAccepted | undefined> {
    const cachedLastDeliveriedIndex = await super.storage.get(OracleRelay.CK_ORACLE_DELIVERIED);
    if (cachedLastDeliveriedIndex) {
      const sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextMessageAccepted({
        messageIndex: +cachedLastDeliveriedIndex,
      });
      if (!sourceNextMessageAccepted) {
        logger.debug(
          `no new assigned message accepted`,
          super.meta('ormpipe-relay', ['oracle:delivery'])
        );
        return;
      }
      const messageAssigned = await this.sourceIndexerOracle.inspectAssigned({
        msgHash: sourceNextMessageAccepted.msgHash,
      });
      if (!messageAssigned) {
        logger.debug(
          `found new message %s(%s), but not assigned to myself`,
          sourceNextMessageAccepted.msgHash,
          sourceNextMessageAccepted.message_index,
          super.meta('ormpipe-relay', ['oracle:delivery'])
        );
        return;
      }
      return sourceNextMessageAccepted;
    }

    const allAssignedList = await this.sourceIndexerOracle.allAssignedList();
    const msgHashes = allAssignedList.map(item => item.msgHash);
    const sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextUndoMessageAccepted({msgHashes});
    if (sourceNextMessageAccepted) {
      return sourceNextMessageAccepted;
    }
    // save cache, if all message deliveried
    const sourceLastMessageAccepted = await this.sourceIndexerOrmp.lastMessageAccepted();
    if (sourceLastMessageAccepted) {
      await super.storage.put(OracleRelay.CK_ORACLE_DELIVERIED, sourceLastMessageAccepted.message_index);
    }
    return sourceNextMessageAccepted;
  }

  private async delivery() {
    logger.debug('start oracle delivery', super.meta('ormpipe-relay', ['oracle:delivery']));
    // delivery start block
    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('ormpipe-relay', ['oracle:delivery'])
    );
    const sourceNextMessageAccepted = await this._lastAssignedMessageAccepted();
    if (!sourceNextMessageAccepted) {
      logger.info(
        `no new assigned message accepted or assigned to self`,
        super.meta('ormpipe-relay', ['oracle:delivery'])
      );
      return;
    }
    const sourceNetwork = await super.lifecycle.sourceClient.evm.getNetwork();
    const targetNetwork = await super.lifecycle.targetClient.evm.getNetwork();
    if (
      sourceNetwork.chainId.toString() != sourceNextMessageAccepted.message_fromChainId ||
      targetNetwork.chainId.toString() != sourceNextMessageAccepted.message_toChainId
    ) {
      logger.warn(
        `expected chain id relation is [%s -> %s], but the message %s(%s) chain id relations is [%s -> %s] skip this message`,
        sourceNetwork.chainId.toString(),
        targetNetwork.chainId.toString(),
        sourceNextMessageAccepted.msgHash,
        sourceNextMessageAccepted.message_index,
        sourceNextMessageAccepted.message_fromChainId,
        sourceNextMessageAccepted.message_toChainId,
        super.meta('ormpipe-relay', ['oracle:delivery']),
      );
      await super.storage.put(OracleRelay.CK_ORACLE_DELIVERIED, sourceNextMessageAccepted.message_index);
      return;
    }


    logger.info(
      `new message accepted %s wait block %s(%s) finalized`,
      sourceNextMessageAccepted.msgHash,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('ormpipe-relay', ['oracle:delivery'])
    );

    const sourceFinalizedBLock = await this.sourceClient.evm.getBlock('finalized', false);
    if (!sourceFinalizedBLock) {
      logger.error(
        'can not get %s finalized block',
        super.sourceName,
        super.meta('ormpipe-relay', ['oracle:delivery']),
      );
      return;
    }
    if (sourceFinalizedBLock.number < +(sourceNextMessageAccepted.blockNumber)) {
      logger.warn(
        'message block not finalized %s/%s(%s)',
        sourceNextMessageAccepted.blockNumber,
        sourceFinalizedBLock.number,
        super.sourceName,
        super.meta('ormpipe-relay', ['oracle:delivery']),
      )
      return;
    }
    logger.debug(
      'message block finalized %s/%s(%s)',
      sourceNextMessageAccepted.blockNumber,
      sourceFinalizedBLock.number,
      super.sourceName,
      super.meta('ormpipe-relay', ['oracle:delivery']),
    );

    const beacons = await this.targetIndexerSubapi.beacons();
    logger.debug(
      'queried %s beacons from %s airnode-dapi contract, prepare to call %s (requestFinalizedHash)',
      beacons.length,
      super.targetName,
      super.targetName,
      super.meta('ormpipe-relay', ['oracle:delivery']),
    );

    const targetTxRequestFinalizedHash = await this.targetSubapiClient.requestFinalizedHash(beacons);
    logger.info(
      'called %s airnode contract requestFinalizedHash {tx: %s, block: %s}, wait aggregate',
      super.targetName,
      chalk.magenta(targetTxRequestFinalizedHash.hash),
      chalk.cyan(targetTxRequestFinalizedHash.blockNumber),
      super.meta('ormpipe-relay', ['oracle:delivery']),
    );

    await super.storage.put(OracleRelay.CK_ORACLE_DELIVERIED, sourceNextMessageAccepted.message_index);
  }

  private async aggregate() {
    logger.debug('start oracle aggregate', super.meta('ormpipe-relay', ['oracle:aggregate']));

    const beacons = await this.targetIndexerSubapi.beacons();
    const countBeacons = beacons.length;
    const beaconIds = beacons.map(item => item.beaconId);
    logger.debug(
      'queried %s beacons from %s airnode-dapi contract. %s',
      countBeacons,
      super.targetName,
      chalk.gray(JSON.stringify(beaconIds)),
      super.meta('ormpipe-relay', ['oracle:aggregate']),
    );

    const distruibutions = await this.targetIndexerSubapi.beaconAirnodeCompletedDistribution(beaconIds);
    if (!distruibutions.length) {
      logger.warn(
        'not have anymore airnode completed events from %s',
        super.targetName,
        super.meta('ormpipe-relay', ['oracle:aggregate']),
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
        super.meta('ormpipe-relay', ['oracle:aggregate']),
      );
      return;
    }
    const completedData = completedDatas[0];

    const cachedLastAggregatedMessageRoot = await super.storage.get(OracleRelay.CK_ORACLE_AGGREGATED);
    if (cachedLastAggregatedMessageRoot && cachedLastAggregatedMessageRoot == completedData) {
      logger.warn(
        'the message root %s already aggregated (queried by cache)',
        completedData,
        super.meta('ormpipe-relay', ['oracle:aggregate']),
      );
      return;
    }

    const lastAggregatedMessageRoot = await this.targetIndexerSubapi.lastAggregatedMessageRoot();
    if (lastAggregatedMessageRoot && lastAggregatedMessageRoot.msgRoot === completedData) {
      logger.warn(
        'the message root %s already aggregated (queried by indexer)',
        completedData,
        super.meta('ormpipe-relay', ['oracle:aggregate']),
      );
      return;
    }

    const aggregateBeaconIds = distruibutions
      .filter(item => item.data == completedData)
      .map(item => item.beaconId)
      .sort((one, two) => (one > two ? 1 : -1));
    logger.debug(
      'aggregate beacons %s to %s subapi contract',
      chalk.gray(JSON.stringify(aggregateBeaconIds)),
      super.targetName,
      super.meta('ormpipe-relay', ['oracle:aggregate']),
    );

    const targetTxAggregateBeacons = await this.targetSubapiClient.aggregateBeacons(aggregateBeaconIds);
    logger.info(
      'aggregated beacons to %s subapi contract {tx: %s, block: %s}',
      super.targetName,
      chalk.magenta(targetTxAggregateBeacons.hash),
      chalk.cyan(targetTxAggregateBeacons.blockNumber),
      super.meta('ormpipe-relay', ['oracle:aggregate']),
    );

    await super.storage.put(OracleRelay.CK_ORACLE_AGGREGATED, completedData);
  }

}
