import { RelayerRelayLifecycle } from "./types/config";
import { CommonRelay, logger, RelayStorage } from "@darwinia/ormpipe-common";
import {
  OracleImportedMessageRoot,
  OrmpMessageAccepted,
  PonderIndexOrmp,
} from "@darwinia/ormpipe-indexer";
import {
  OrmpProtocolMessage,
  RelayerContractClient,
} from "./client/contract_relayer";
import { IncrementalMerkleTree } from "./helper/imt";
import { AbiCoder } from "ethers";
import chalk = require("chalk");

interface RelayerRelayOptions {
  times: number;
  sourceChainId: number;
  targetChainId: number;
}

interface RelayerRelayFullOptions extends RelayerRelayOptions {
  lastImportedMessageRoot: OracleImportedMessageRoot;
}

export class RelayerRelay extends CommonRelay<RelayerRelayLifecycle> {
  private static CK_RELAYER_RELAIED = "ormpipe.relayer.relaied";
  private static CK_RELAYER_SKIPPED = "ormpipe.relayer.skipped";

  private _sourceRelayerContractClient?: RelayerContractClient;
  private _targetRelayerContractClient?: RelayerContractClient;

  constructor(lifecycle: RelayerRelayLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerOrmp(): PonderIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp;
  }

  public get targetIndexerOrmp(): PonderIndexOrmp {
    return super.lifecycle.targetIndexerOrmp;
  }

  public get sourceRelayerClient(): RelayerContractClient {
    if (this._sourceRelayerContractClient)
      return this._sourceRelayerContractClient;
    this._sourceRelayerContractClient = new RelayerContractClient({
      chainName: super.sourceName,
      signer: super.lifecycle.sourceSigner,
      address: super.lifecycle.sourceChain.contract.relayer,
      evm: super.sourceClient.evm,
    });
    return this._sourceRelayerContractClient;
  }

  public get targetRelayerClient(): RelayerContractClient {
    if (this._targetRelayerContractClient)
      return this._targetRelayerContractClient;
    this._targetRelayerContractClient = new RelayerContractClient({
      chainName: super.targetName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.relayer,
      evm: super.targetClient.evm,
    });
    return this._targetRelayerContractClient;
  }

  public async start() {
    try {
      const sourceChainId = await super.sourceChainId();
      const targetChainId = await super.targetChainId();

      const options: RelayerRelayOptions = {
        sourceChainId,
        targetChainId,
        times: this.lifecycle.times,
      };
      await this.relay(options);
    } catch (e: any) {
      logger.error(e, super.meta("ormpipe-relay"));
    }
  }

  private async relay(options: RelayerRelayOptions) {
    logger.debug(
      "start relayer relay",
      super.meta("ormpipe-relay-relayer", ["relayer"])
    );

    logger.debug(
      `query last message dispatched from ${super.sourceName}`,
      super.meta("ormpipe-relay", ["relayer:relay"])
    );

    const lastImportedMessageRoot =
      await super.lifecycle.targetIndexerOrmp.lastImportedMessageRoot({
        fromChainId: options.sourceChainId,
        toChainId: options.targetChainId,
      });
    if (!lastImportedMessageRoot) {
      logger.info(
        "not have any imported message from %s",
        super.sourceName,
        super.meta("ormpipe-relay-relayer", ["relayer"])
      );
      return;
    }
    const fullOptions = {
      ...options,
      lastImportedMessageRoot,
      times: options.times,
    };

    const sourceNextMessageAccepted = await this._lastAssignedMessageAccepted(
      fullOptions
    );
    if (!sourceNextMessageAccepted) {
      logger.info(
        `no new assigned message accepted`,
        super.meta("ormpipe-relay", ["relayer"])
      );
      return;
    }
    await this._relay(fullOptions, sourceNextMessageAccepted);
  }

  private async _relay(
    options: RelayerRelayFullOptions,
    sourceNextMessageAccepted: OrmpMessageAccepted
  ) {
    if (
      options.sourceChainId.toString() !=
        sourceNextMessageAccepted.messageFromChainId ||
      options.targetChainId.toString() !=
        sourceNextMessageAccepted.messageToChainId
    ) {
      logger.warn(
        `expected chain id relation is [%s -> %s], but the message %s(%s) chain id relations is [%s -> %s] skip this message`,
        options.sourceChainId.toString(),
        options.targetChainId.toString(),
        sourceNextMessageAccepted.msgHash,
        sourceNextMessageAccepted.messageIndex,
        sourceNextMessageAccepted.messageFromChainId,
        sourceNextMessageAccepted.messageToChainId,
        super.meta("ormpipe-relay-relayer", ["relayer"])
      );
      await super.storage.put(
        RelayerRelay.CK_RELAYER_RELAIED,
        sourceNextMessageAccepted.messageIndex
      );
      return;
    }
    const message: OrmpProtocolMessage = {
      channel: sourceNextMessageAccepted.messageChannel,
      index: +sourceNextMessageAccepted.messageIndex,
      fromChainId: +sourceNextMessageAccepted.messageFromChainId,
      from: sourceNextMessageAccepted.messageFrom,
      toChainId: +sourceNextMessageAccepted.messageToChainId,
      to: sourceNextMessageAccepted.messageTo,
      gasLimit: BigInt(sourceNextMessageAccepted.messageGasLimit),
      encoded: sourceNextMessageAccepted.messageEncoded,
    };

    const lastImportedMessageRoot = options.lastImportedMessageRoot;
    const lastAggregatedMessageAccepted =
      await this.sourceIndexerOrmp.inspectMessageAccepted({
        chainId: options.sourceChainId,
        root: lastImportedMessageRoot.hash,
      });
    const rawMsgHashes = await this.sourceIndexerOrmp.queryRelayerMessageHashes(
      {
        chainId: +options.sourceChainId,
        messageIndex: +lastAggregatedMessageAccepted!.messageIndex,
      }
    );
    const msgHashes = rawMsgHashes.map((item) =>
      Buffer.from(item.replace("0x", ""), "hex")
    );
    const imt = new IncrementalMerkleTree(msgHashes);
    const messageProof = imt.getSingleHexProof(message.index);

    const abiCoder = AbiCoder.defaultAbiCoder();
    // const params = sourceNextRelayerAssigned.params;
    // const decodedGasLimit = abiCoder.decode(['uint'], params);
    // const gasLimit = decodedGasLimit[0];

    const encodedProof = abiCoder.encode(
      ["tuple(uint blockNumber, uint messageIndex, bytes32[32] messageProof)"],
      [
        {
          blockNumber: +lastImportedMessageRoot.srcBlockNumber,
          messageIndex: message.index,
          messageProof: messageProof,
        },
      ]
    );

    // console.log('last imported message root', lastImportedMessageRoot.hash);
    // console.log('root', imt.root());
    // console.log('msg hashes', rawMsgHashes.length, rawMsgHashes);
    // console.log('message', message);
    // console.log('proof', messageProof);

    const sim = new SkippedIndexManager(
      super.storage,
      RelayerRelay.CK_RELAYER_SKIPPED
    );

    // console.log('------ relay');
    const baseGas = await this.sourceRelayerClient.configOf(
      options.targetChainId
    );

    let targetTxRelayMessage;
    try {
      targetTxRelayMessage = await this.targetRelayerClient.relay({
        message,
        proof: encodedProof,
        gasLimit: BigInt(sourceNextMessageAccepted.messageGasLimit) + baseGas,
        chainId: options.targetChainId,
      });
    } catch (e: any) {
      logger.error(
        "failed to relay message %s(%s) to %s: %s",
        message.index,
        super.sourceName,
        super.targetName,
        e ? e.message : e,
        super.meta("ormpipe-relay", ["relayer:relay"])
      );
      await sim.put(+message.index);
      return;
    }

    if (!targetTxRelayMessage) {
      logger.warn(
        "gas increase rate is too high, skip message %s in %s",
        message.index,
        super.sourceName,
        super.meta("ormpipe-relay", ["relayer:relay"])
      );
      await sim.put(message.index);
      return;
    }
    logger.info(
      "message relayed to %s {tx: %s, block: %s}",
      super.targetName,
      chalk.magenta(targetTxRelayMessage.hash),
      chalk.cyan(targetTxRelayMessage.blockNumber),
      super.meta("ormpipe-relay", ["relayer:relay"])
    );

    await sim.remove(message.index);
    await super.storage.put(RelayerRelay.CK_RELAYER_RELAIED, message.index);
  }

  private async _lastAssignedMessageAccepted(
    options: RelayerRelayFullOptions
  ): Promise<OrmpMessageAccepted | undefined> {
    const lastImportedMessageRoot = options.lastImportedMessageRoot;
    const lastImportedMessageAccepted =
      await this.sourceIndexerOrmp.inspectMessageAccepted({
        chainId: options.sourceChainId,
        root: lastImportedMessageRoot.hash,
      });

    if (!lastImportedMessageAccepted) {
      logger.debug(
        "found new message root %s from %s but not found this message from accepted.",
        lastImportedMessageRoot.hash,
        super.targetName,
        super.meta("ormpipe-relay-relayer", ["relayer"])
      );
      return undefined;
    }

    const pickedRelayerMessageAcceptedHashes =
      await this.sourceIndexerOrmp.pickRelayerMessageAcceptedHashes({
        messageIndex: +lastImportedMessageAccepted.messageIndex,
        fromChainId: options.sourceChainId,
        toChainId: options.targetChainId,
      });
    const pickedUnRelayedMessageHashes =
      await this.targetIndexerOrmp.pickUnRelayedMessageHashes(
        options.targetChainId,
        pickedRelayerMessageAcceptedHashes
      );
    const unRelayMessageAcceptedList =
      await this.sourceIndexerOrmp.queryMessageAcceptedListByHashes({
        chainId: options.sourceChainId,
        msgHashes: pickedUnRelayedMessageHashes,
      });
    if (!unRelayMessageAcceptedList.length) {
      logger.debug(
        "not found wait relay messages from %s",
        super.sourceName,
        super.meta("ormpipe-relay-relayer", ["relayer"])
      );
      return undefined;
    }

    const sourceLastMessageAssignedAccepted =
      await this.sourceIndexerOrmp.lastRelayerAssigned({
        fromChainId: options.sourceChainId,
        toChainId: options.targetChainId,
      });

    let unRelayedIndex = -1;
    while (true) {
      unRelayedIndex += 1;
      if (unRelayMessageAcceptedList.length - 1 < unRelayedIndex) {
        logger.info(
          "not have more unrelayed message acceipte list from %s",
          super.sourceName,
          super.meta("ormpipe-relay-relayer", ["relayer"])
        );
        return;
      }
      const nextUnRelayMessageAccepted =
        unRelayMessageAcceptedList[unRelayedIndex];
      const currentMessageIndex = nextUnRelayMessageAccepted.messageIndex;

      logger.info(
        "sync status [%s,%s] (%s)",
        currentMessageIndex,
        sourceLastMessageAssignedAccepted?.messageIndex ?? -1,
        super.sourceName,
        super.meta("ormpipe-relay", ["relayer:relay"])
      );

      const sim = new SkippedIndexManager(
        super.storage,
        RelayerRelay.CK_RELAYER_SKIPPED
      );
      const skippedIndexOfCurrentMessage = await sim.indexOf(
        +currentMessageIndex
      );
      if (skippedIndexOfCurrentMessage > -1) {
        if (options.times % (skippedIndexOfCurrentMessage + 2) != 0) {
          logger.info(
            `the message %s (%s) skipped, will retry later`,
            currentMessageIndex,
            super.sourceName,
            super.meta("ormpipe-relay", ["relayer:relay"])
          );
          continue;
        }
        logger.info(
          "retry relay skipped message %s (%s)",
          currentMessageIndex,
          super.sourceName,
          super.meta("ormpipe-relay", ["relayer:relay"])
        );
      }

      const cachedLastDeliveriedIndex = await super.storage.get(
        RelayerRelay.CK_RELAYER_RELAIED
      );
      if (currentMessageIndex == cachedLastDeliveriedIndex) {
        logger.info(
          `the message %s already relayed to %s (queried by cache)`,
          currentMessageIndex,
          super.targetName,
          super.meta("ormpipe-relay", ["relayer:relay"])
        );
        continue;
      }

      logger.info(
        `new message accepted %s in %s(%s) prepared`,
        nextUnRelayMessageAccepted.msgHash,
        nextUnRelayMessageAccepted.blockNumber,
        super.sourceName,
        super.meta("ormpipe-relay", ["relayer:relay"])
      );

      return nextUnRelayMessageAccepted;
    }
  }
}

class SkippedIndexManager {
  constructor(private storage: RelayStorage, private key: string) {}

  private async write(skippedList: number[]) {
    const rawSkipped = skippedList.join(",");
    await this.storage.put(this.key, rawSkipped);
  }

  public async load(): Promise<number[]> {
    const rawSkipped: string | undefined = await this.storage.get(this.key);
    if (!rawSkipped) return [];
    return rawSkipped.split(",").map((item) => +item);
  }

  public async remove(index: number) {
    const skippedList = await this.load();
    const newSkippedList = skippedList.filter((item) => item != index);
    await this.write(newSkippedList);
  }

  public async put(index: number) {
    await this.remove(index);
    const skippedList = await this.load();
    const newSkippedList = [...skippedList, index];
    await this.write(newSkippedList);
  }

  public async indexOf(index: number): Promise<number> {
    const skippedList = await this.load();
    return skippedList.indexOf(index);
  }

  public async isSkipped(index: number): Promise<boolean> {
    const skippedList = await this.load();
    return skippedList.indexOf(index) > -1;
  }
}
