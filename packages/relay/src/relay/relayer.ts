import {RelayerLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexOrmp, ThegraphIndexerAirnode, ThegraphIndexerRelayer} from "@darwinia/ormpipe-indexer";
import {RelayerContractClient} from "../client/contract_relayer";
import {logger} from "@darwinia/ormpipe-logger";

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

  public get targetRelayerClient(): RelayerContractClient {
    return super.lifecycle.targetRelayerClient
  }

  public async start() {
    try {
      await this.run();
    } catch (e: any) {
      logger.error(e, super.meta('relayer'));
    }
  }

  private async run() {
    logger.debug('start relayer relay', super.meta('relayer', ['relay']));

    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('relayer', ['relay'])
    );
    const targetLastMessageDispatched = await this.targetIndexerOrmp.lastMessageDispatched();
    // todo: check running block
    const queryNextMessageStartBlockNumber = +(targetLastMessageDispatched?.blockNumber ?? 0);
    logger.debug(
      `queried next relayer from block number %s(%s)`,
      queryNextMessageStartBlockNumber,
      super.sourceName,
      super.meta('relayer', ['relay'])
    );
    const sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextMessageAccepted({
      blockNumber: queryNextMessageStartBlockNumber,
    });
    if (!sourceNextMessageAccepted) {
      logger.info('not have more message accepted', super.meta('relayer', ['relay']));
      return;
    }
    const sourceNextRelayerAssigned = await this.sourceIndexerRelayer.nextAssigned({
      blockNumber: queryNextMessageStartBlockNumber,
    });
    if (!sourceNextRelayerAssigned || sourceNextMessageAccepted.msgHash !== sourceNextRelayerAssigned.msgHash) {
      logger.info(
        `new message accepted but not assigned to myself. %s`,
        sourceNextMessageAccepted.msgHash,
        super.meta('relayer', ['relay'])
      );
      return;
    }
    logger.info(
      `new message accepted %s wait block %s(%s) finalized`,
      sourceNextMessageAccepted.msgHash,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('relayer', ['relay'])
    );

    const targetLastAggregatedMessageRoot = await this.targetIndexerAirnode.lastAggregatedMessageRoot();
    if (!targetLastAggregatedMessageRoot) {
      logger.warn(
        'not have any aggregated message root from %s',
        super.targetName,
        super.meta('relayer', ['relay'])
      );
      return;
    }
    const lastAggregatedMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
      msgHash: targetLastAggregatedMessageRoot.msgRoot,
    });
    if (!lastAggregatedMessageAccepted) {
      logger.warn(
        'can not query message accepted from %s use aggregated message %s %s',
        super.sourceName,
        super.targetName,
        targetLastAggregatedMessageRoot.msgRoot,
        super.meta('relayer', ['relay'])
      );
      return;
    }
    if (sourceNextMessageAccepted.blockNumber <= lastAggregatedMessageAccepted.blockNumber) {
      logger.info(
        'last accepted message already aggregated from %s',
        super.targetName,
        super.meta('relayer', ['relay'])
      );
      return;
    }

    sourceNextMessageAccepted.message_index
    logger.info('relay message');
    // todo: relay message
    await this.targetRelayerClient.relay();
  }

}
