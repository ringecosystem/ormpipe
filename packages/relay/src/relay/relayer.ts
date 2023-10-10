import {RelayerLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexOrmp, ThegraphIndexerAirnode, ThegraphIndexerRelayer} from "@darwinia/ormpipe-indexer";
import {OrmpProtocolMessage, RelayerContractClient} from "../client/contract_relayer";
import {logger} from "@darwinia/ormpipe-logger";
import {IncrementalMerkleTree} from '../helper/imt'
import {AbiCoder} from "ethers";
import chalk = require('chalk');

export class RelayerRelay extends CommonRelay<RelayerLifecycle> {

  private static CK_RELAYER_RELAIED = 'ormpipe.relayer.relaied';

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
      logger.error(e, super.meta('ormpipe-relay', ['relayer:relay']));
    }
  }

  private async run() {
    logger.debug('start relayer relay', super.meta('ormpipe-relay', ['relayer:relay']));

    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('ormpipe-relay', ['relayer:relay'])
    );
    let queryNextMessageIndexStart = -1;
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
      `queried next relayer from message index %s at block %s(%s)`,
      queryNextMessageIndexStart,
      sourceMessageIndexAtBlock,
      super.sourceName,
      super.meta('ormpipe-relay', ['relayer:relay'])
    );
    const sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextMessageAccepted({
      messageIndex: queryNextMessageIndexStart,
    });
    const sourceLastMessageAccepted = await this.sourceIndexerOrmp.lastMessageAccepted();
    logger.info(
      'sync status [%s,%s] (%s)',
      sourceNextMessageAccepted?.message_index ?? queryNextMessageIndexStart,
      sourceLastMessageAccepted?.message_index ?? 0,
      super.sourceName,
      super.meta('ormpipe-relay', ['relayer:relay']),
    );

    if (!sourceNextMessageAccepted) {
      logger.info('not have more message accepted', super.meta('ormpipe-relay', ['relayer:relay']));
      return;
    }

    const cachedLastRelaiedIndex = await super.storage.get(RelayerRelay.CK_RELAYER_RELAIED);
    if (cachedLastRelaiedIndex && cachedLastRelaiedIndex == queryNextMessageIndexStart) {
      logger.warn(
        'the message index (%s) already relay to %s, please wait finalized',
        queryNextMessageIndexStart,
        super.targetName,
        super.meta('ormpipe-relay', ['relayer:relay'])
      );
      return;
    }

    const sourceNextRelayerAssigned = await this.sourceIndexerRelayer.nextAssigned({
      msgHash: sourceNextMessageAccepted.msgHash,
    });
    if (!sourceNextRelayerAssigned) {
      logger.info(
        `new message accepted but not assigned to myself. %s`,
        sourceNextMessageAccepted.msgHash,
        super.meta('ormpipe-relay', ['relayer:relay'])
      );
      return;
    }
    logger.info(
      'new message accepted %s from %s(%s)',
      sourceNextMessageAccepted.msgHash,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('ormpipe-relay', ['relayer:relay'])
    );

    const targetLastAggregatedMessageRoot = await this.targetIndexerAirnode.lastAggregatedMessageRoot();
    if (!targetLastAggregatedMessageRoot) {
      logger.warn(
        'not have any aggregated message root from %s',
        super.targetName,
        super.meta('ormpipe-relay', ['relayer:relay'])
      );
      return;
    }
    const sourceLastAggregatedMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
      root: targetLastAggregatedMessageRoot.msgRoot,
    });
    if (!sourceLastAggregatedMessageAccepted) {
      logger.warn(
        'can not query message accepted from %s use aggregated message %s %s',
        super.sourceName,
        super.targetName,
        targetLastAggregatedMessageRoot.msgRoot,
        super.meta('ormpipe-relay', ['relayer:relay'])
      );
      return;
    }
    // console.log(sourceNextMessageAccepted.blockNumber, sourceLastAggregatedMessageAccepted.blockNumber);
    if (sourceNextMessageAccepted.blockNumber > sourceLastAggregatedMessageAccepted.blockNumber) {
      logger.info(
        'last accepted message large than aggregated message from %s (%s > %s)',
        super.targetName,
        sourceNextMessageAccepted.blockNumber,
        sourceLastAggregatedMessageAccepted.blockNumber,
        super.meta('ormpipe-relay', ['relayer:relay'])
      );
      return;
    }


    const message: OrmpProtocolMessage = {
      channel: sourceNextMessageAccepted.message_channel,
      index: +sourceNextMessageAccepted.message_index,
      fromChainId: +sourceNextMessageAccepted.message_fromChainId,
      from: sourceNextMessageAccepted.message_from,
      toChainId: +sourceNextMessageAccepted.message_toChainId,
      to: sourceNextMessageAccepted.message_to,
      encoded: sourceNextMessageAccepted.message_encoded,
    };

    const rawMsgHashes = await this.sourceIndexerOrmp.messageHashes({
      messageIndex: +sourceLastAggregatedMessageAccepted.message_index,
    });
    const msgHashes = rawMsgHashes.map(item => Buffer.from(item.replace('0x', ''), 'hex'));
    const imt = new IncrementalMerkleTree(msgHashes);
    const messageProof = imt.getSingleHexProof(message.index);

    const abiCoder = AbiCoder.defaultAbiCoder();
    const params = sourceNextRelayerAssigned.params;
    const decodedGasLimit = abiCoder.decode(['uint'], params);
    const gasLimit = decodedGasLimit[0];

    const encodedProof = abiCoder.encode([
        'tuple(uint blockNumber, uint messageIndex, bytes32[32] messageProof)'],
      [
        {
          blockNumber: sourceNextMessageAccepted.blockNumber,
          messageIndex: message.index,
          messageProof: messageProof
        }
      ]
    );

    // console.log(imt.root());
    // console.log(rawMsgHashes);
    // console.log(message);
    // console.log(messageProof);
    //
    // console.log('------ relay');
    const targetTxRelayMessage = await this.targetRelayerClient.relay(message, encodedProof, gasLimit);
    logger.info(
      'message relayed to %s {tx: %s, block: %s}',
      super.targetName,
      chalk.magenta(targetTxRelayMessage.hash),
      chalk.cyan(targetTxRelayMessage.blockNumber),
      super.meta('ormpipe-relay', ['relayer:relay'])
    );

    await super.storage.put(RelayerRelay.CK_RELAYER_RELAIED, queryNextMessageIndexStart);
  }

}
