import {RelayerLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {
  OrmpMessageAccepted,
  ThegraphIndexerSubapi,
  ThegraphIndexerRelayer,
  ThegraphIndexOrmp
} from "@darwinia/ormpipe-indexer";
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

  public get targetIndexerSubapi(): ThegraphIndexerSubapi {
    return super.lifecycle.targetIndexerSubapi
  }

  public get sourceRelayerClient(): RelayerContractClient {
    return super.lifecycle.sourceRelayerClient
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

  private async _lastAssignedMessageAccepted(): Promise<OrmpMessageAccepted | undefined> {
    const lastAggregatedMessageRoot = await this.targetIndexerSubapi.lastAggregatedMessageRoot();
    if (!lastAggregatedMessageRoot) {
      logger.debug(
        'not have any aggregated message from %s',
        super.targetName,
        super.meta('ormpipe-relay', ['relayer:relay']),
      );
      return undefined;
    }
    const lastAggreatedMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
      root: lastAggregatedMessageRoot.ormpData_root,
    });

    if (!lastAggreatedMessageAccepted) {
      logger.debug(
        'found new message root %s from %s but not found this message from accepted.',
        lastAggregatedMessageRoot.ormpData_root,
        super.targetName,
        super.meta('ormpipe-relay', ['relayer:relay']),
      );
      return undefined;
    }

    const preparedMessageAcceptedHashes = await this.sourceIndexerOrmp.queryPreparedMessageAcceptedHashes({
      messageIndex: +lastAggreatedMessageAccepted.message_index,
    });
    const pickedPreparedAssignedMessageHashes = await this.sourceIndexerRelayer.pickAssignedMessageHashes(
      preparedMessageAcceptedHashes
    );
    const pickedUnRelayedMessageHashes = await this.targetIndexerOrmp.pickUnRelayedMessageHashes(
      pickedPreparedAssignedMessageHashes
    );
    const unRelayMessageAcceptedList = await this.sourceIndexerOrmp.queryMessageAcceptedListByHashes({
      msgHashes: pickedUnRelayedMessageHashes,
    });
    if (!unRelayMessageAcceptedList.length) {
      logger.debug(
        'not found wait relay messages from %s',
        super.sourceName,
        super.meta('ormpipe-relay', ['relayer:relay']),
      );
      return undefined;
    }

    const sourceLastAssignedMessage = await this.sourceIndexerRelayer.lastAssignedMessage();
    const sourceLastMessageAssignedAccepted = sourceLastAssignedMessage
      ? await this.sourceIndexerOrmp.inspectMessageAccepted({
        msgHash: sourceLastAssignedMessage.msgHash,
      })
      : null;

    let unRelayedIndex = -1;
    while (true) {
      unRelayedIndex += 1;
      if (unRelayMessageAcceptedList.length - 1 < unRelayedIndex) {
        logger.debug(
          'not have more unrelayed message acceipte list from %s',
          super.sourceName,
          super.meta('ormpipe-relay', ['relayer:relay']),
        );
        return;
      }
      const nextUnRelayMessageAccepted = unRelayMessageAcceptedList[unRelayedIndex];

      const currentMessageIndex = nextUnRelayMessageAccepted.message_index;
      logger.info(
        'sync status [%s,%s] (%s)',
        currentMessageIndex,
        sourceLastMessageAssignedAccepted?.message_index ?? -1,
        super.sourceName,
        super.meta('ormpipe-relay', ['relayer:relay']),
      );

      const cachedLastDeliveriedIndex = await super.storage.get(RelayerRelay.CK_RELAYER_RELAIED);
      if (currentMessageIndex == cachedLastDeliveriedIndex) {
        logger.debug(
          `the message %s already relayed to %s (queried by cache)`,
          currentMessageIndex,
          super.targetName,
          super.meta('ormpipe-relay', ['relayer:relay'])
        );
        continue;
      }
      // const queriedDispatched = await this.targetIndexerOrmp.inspectMessageDispatched({
      //   msgHash: nextUnRelayMessageAccepted.msgHash,
      // });
      // if (queriedDispatched) {
      //   logger.debug(
      //     `the message %s already relayed to %s (queried by indexer dispatched event)`,
      //     currentMessageIndex,
      //     super.targetName,
      //     super.meta('ormpipe-relay', ['relayer:relay'])
      //   );
      //   return;
      // }

      logger.info(
        `new message accepted %s in %s(%s) prepared`,
        nextUnRelayMessageAccepted.msgHash,
        nextUnRelayMessageAccepted.blockNumber,
        super.sourceName,
        super.meta('ormpipe-relay', ['relayer:relay'])
      );

      return nextUnRelayMessageAccepted;
    }
  }

  private async run() {
    logger.debug('start relayer relay', super.meta('ormpipe-relay', ['relayer:relay']));

    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('ormpipe-relay', ['relayer:relay'])
    );

    const sourceNextMessageAccepted = await this._lastAssignedMessageAccepted();
    if (!sourceNextMessageAccepted) {
      logger.info(
        `no new assigned message accepted`,
        super.meta('ormpipe-relay', ['relayer:relay'])
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
        super.meta('ormpipe-relay', ['relayer:relay']),
      );
      await super.storage.put(RelayerRelay.CK_RELAYER_RELAIED, sourceNextMessageAccepted.message_index);
      return;
    }

    const baseGas = await this.sourceRelayerClient.configOf(targetNetwork.chainId);
    const message: OrmpProtocolMessage = {
      channel: sourceNextMessageAccepted.message_channel,
      index: +sourceNextMessageAccepted.message_index,
      fromChainId: +sourceNextMessageAccepted.message_fromChainId,
      from: sourceNextMessageAccepted.message_from,
      toChainId: +sourceNextMessageAccepted.message_toChainId,
      to: sourceNextMessageAccepted.message_to,
      gasLimit: BigInt(sourceNextMessageAccepted.message_gasLimit) + baseGas,
      encoded: sourceNextMessageAccepted.message_encoded,
    };


    const lastAggregatedMessageRoot = await this.targetIndexerSubapi.lastAggregatedMessageRoot();
    const lastAggreatedMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
      root: lastAggregatedMessageRoot!.ormpData_root,
    });
    const rawMsgHashes = await this.sourceIndexerOrmp.messageHashes({
      messageIndex: +lastAggreatedMessageAccepted!.message_index,
    });
    const msgHashes = rawMsgHashes.map(item => Buffer.from(item.replace('0x', ''), 'hex'));
    const imt = new IncrementalMerkleTree(msgHashes);
    const messageProof = imt.getSingleHexProof(message.index);

    const abiCoder = AbiCoder.defaultAbiCoder();
    // const params = sourceNextRelayerAssigned.params;
    // const decodedGasLimit = abiCoder.decode(['uint'], params);
    // const gasLimit = decodedGasLimit[0];

    const encodedProof = abiCoder.encode([
        'tuple(uint blockNumber, uint messageIndex, bytes32[32] messageProof)'
      ],
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
    const targetTxRelayMessage = await this.targetRelayerClient.relay(message, encodedProof);
    logger.info(
      'message relayed to %s {tx: %s, block: %s}',
      super.targetName,
      chalk.magenta(targetTxRelayMessage.hash),
      chalk.cyan(targetTxRelayMessage.blockNumber),
      super.meta('ormpipe-relay', ['relayer:relay'])
    );

    await super.storage.put(RelayerRelay.CK_RELAYER_RELAIED, message.index);
  }

}
