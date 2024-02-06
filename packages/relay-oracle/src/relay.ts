import {OracleRelayLifecycle} from "./types/config";
import {CommonRelay, logger} from "@darwinia/ormpipe-common";
import {
  OrmpMessageAccepted,
  SignatureSubmittion,
  ThegraphIndexOracle,
  ThegraphIndexOrmp
} from "@darwinia/ormpipe-indexer";
import {MultisigContractClient} from "./client/contract_multisig";
import {SigncribeContractClient, SigncribeData} from "./client/contract_signcribe";
import {ThegraphIndexSigncribe} from "@darwinia/ormpipe-indexer/dist/thegraph/signcribe";

import {AbiCoder, ethers} from "ethers";
import {OrmpContractClient} from "./client/contract_ormp";
import {OracleContractClient} from "./client/contract_oracle";

interface OracleSignOptions {
  sourceChainId: number
  targetChainId: number
  mainly: boolean
}

interface LastSignature {
  signatures: SignatureSubmittion[],
  last?: SignatureSubmittion,
  completed: boolean
}

export class OracleRelay extends CommonRelay<OracleRelayLifecycle> {

  private static CK_ORACLE_SIGNED = 'ormpipe.oracle.signed';

  private _targetMultisigContractClient?: MultisigContractClient;
  private _targetOracleContractClient?: OracleContractClient;
  private _signcribeContractClient?: SigncribeContractClient;
  private _ormpContractClient?: OrmpContractClient;

  constructor(lifecycle: OracleRelayLifecycle) {
    super(lifecycle);
  }

  public get indexerSigncribe(): ThegraphIndexSigncribe {
    return super.lifecycle.indexerSigncribe
  }

  public get sourceIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp
  }

  public get targetIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.targetIndexerOrmp
  }

  public get targetIndexerOracle(): ThegraphIndexOracle {
    return super.lifecycle.targetIndexOracle
  }

  public get targetMultisigContract(): MultisigContractClient {
    if (this._targetMultisigContractClient) return this._targetMultisigContractClient;
    this._targetMultisigContractClient = new MultisigContractClient({
      chainName: super.targetName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.multisig,
      evm: super.targetClient.evm,
    });
    return this._targetMultisigContractClient;
  }

  public get targetOracleContract(): OracleContractClient {
    if (this._targetOracleContractClient) return this._targetOracleContractClient;
    this._targetOracleContractClient = new OracleContractClient({
      chainName: super.targetName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.oracle,
      evm: super.targetClient.evm,
    });
    return this._targetOracleContractClient;
  }

  public get signcribeContract(): SigncribeContractClient {
    if (this._signcribeContractClient) return this._signcribeContractClient;
    this._signcribeContractClient = new SigncribeContractClient({
      chainName: 'signcribe',
      signer: super.lifecycle.signcribeSigner,
      address: super.lifecycle.sourceChain.contract.signcribe,
      evm: super.lifecycle.signcribeClient.evm,
    });
    return this._signcribeContractClient;
  }

  public get sourceOrmpContract(): OrmpContractClient {
    if (this._ormpContractClient) return this._ormpContractClient;
    this._ormpContractClient = new OrmpContractClient({
      chainName: super.sourceName,
      signer: super.lifecycle.sourceSigner,
      address: super.lifecycle.sourceChain.contract.ormp,
      evm: super.sourceClient.evm,
    });
    return this._ormpContractClient;
  }


  public async start() {
    try {
      const sourceChainId = await super.sourceChainId();
      const targetChainId = await super.targetChainId();

      const options: OracleSignOptions = {
        sourceChainId,
        targetChainId,
        mainly: super.lifecycle.mainly,
      };
      await this.sign(options);
    } catch (e: any) {
      logger.error(e, super.meta('ormpipe-relay'));
    }
  }

  private async _lastAssignedMessageAccepted(options: OracleSignOptions): Promise<OrmpMessageAccepted | undefined> {
    const lastImportedMessageRoot = await this.targetIndexerOracle.lastImportedMessageRoot({
      chainId: options.sourceChainId,
    });

    let nextAssignedMessageAccepted;
    if (!lastImportedMessageRoot) {
      const msgHashes = await this.sourceIndexerOrmp.pickOracleAssignedMessageHashes({
        toChainId: options.targetChainId,
      });

      if (msgHashes.length) {
        const unRelayedMessagesQueriedFromTarget = await this.targetIndexerOrmp.pickUnRelayedMessageHashes(msgHashes);
        if (!unRelayedMessagesQueriedFromTarget.length) {
          logger.debug(
            'not have any unrelayed messages from %s',
            super.sourceName,
            super.meta('ormpipe-relay', ['oracle'])
          );
          return undefined;
        }
        nextAssignedMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
          msgHash: unRelayedMessagesQueriedFromTarget[0],
        });
      } else {
        nextAssignedMessageAccepted = await this.sourceIndexerOrmp.nextOracleMessageAccepted({
          messageIndex: -1,
          toChainId: options.targetChainId,
        });
      }
      return nextAssignedMessageAccepted;
    }

    const currentMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
      root: lastImportedMessageRoot.messageRoot,
    });
    if (!currentMessageAccepted) {
      logger.warn(
        'can not query message accepted by roo: %s',
        lastImportedMessageRoot.messageRoot,
        super.meta('ormpipe-relay')
      );
      return;
    }
    nextAssignedMessageAccepted = await this.sourceIndexerOrmp.nextOracleMessageAccepted({
      messageIndex: +currentMessageAccepted.message_index,
      toChainId: options.targetChainId,
    });

    return nextAssignedMessageAccepted;
  }


  private async sign(options: OracleSignOptions) {
    logger.debug('start oracle sign', super.meta('ormpipe-relay-oracle', ['oracle:sign']));
    // delivery start block
    const sourceNextMessageAccepted = await this._lastAssignedMessageAccepted(options);
    if (!sourceNextMessageAccepted) {
      logger.info(
        `no new assigned message accepted or assigned to self`,
        super.meta('ormpipe-relay-oracle', ['oracle:sign'])
      );
      return;
    }
    // check chain pair
    if (
      options.sourceChainId.toString() != sourceNextMessageAccepted.message_fromChainId ||
      options.targetChainId.toString() != sourceNextMessageAccepted.message_toChainId
    ) {
      logger.warn(
        `expected chain id relation is [%s -> %s], but the message %s(%s) chain id relations is [%s -> %s] skip this message`,
        this.sourceChainId.toString(),
        this.targetChainId.toString(),
        sourceNextMessageAccepted.msgHash,
        sourceNextMessageAccepted.message_index,
        sourceNextMessageAccepted.message_fromChainId,
        sourceNextMessageAccepted.message_toChainId,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      await super.storage.put(OracleRelay.CK_ORACLE_SIGNED, sourceNextMessageAccepted.message_index);
      return;
    }
    const cachedSignedMessageIndex: number | undefined = await super.storage.get(OracleRelay.CK_ORACLE_SIGNED);
    if (cachedSignedMessageIndex != undefined) {
      if (+sourceNextMessageAccepted.message_index == cachedSignedMessageIndex) {
        logger.warn(
          'this message index %s already signed and executed, queried by cache: %s',
          sourceNextMessageAccepted.message_index,
          cachedSignedMessageIndex,
          super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        )
        return;
      }
    }


    logger.info(
      `new message accepted %s wait block %s(%s) finalized`,
      sourceNextMessageAccepted.msgHash,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('ormpipe-relay-oracle', ['oracle:sign'])
    );

    // check finalized
    const sourceFinalizedBLock = await this.sourceClient.evm.getBlock('finalized', false);
    if (!sourceFinalizedBLock) {
      logger.error(
        'can not get %s finalized block',
        super.sourceName,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      return;
    }
    if (sourceFinalizedBLock.number < +(sourceNextMessageAccepted.blockNumber)) {
      logger.warn(
        'message block not finalized %s/%s(%s)',
        sourceFinalizedBLock.number,
        sourceNextMessageAccepted.blockNumber,
        super.sourceName,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      )
      return;
    }
    logger.info(
      'message block finalized %s/%s(%s)',
      sourceFinalizedBLock.number,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('ormpipe-relay-oracle', ['oracle:sign']),
    );

    // check sign progress
    const lastSignature = await this._lastSignature(
      +sourceNextMessageAccepted.message_fromChainId,
      +sourceNextMessageAccepted.message_index,
    );

    // check root by chain rpc
    const queriedRootFromContract = await this.sourceOrmpContract.root({
      blockNumber: +sourceNextMessageAccepted.blockNumber,
      msgIndex: +sourceNextMessageAccepted.message_index,
    });
    if (!queriedRootFromContract) {
      logger.error(
        'can not query message root by %s(%s) from ormp contract',
        sourceNextMessageAccepted.message_index,
        super.sourceName,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      return;
    }

    const targetSigner = super.targetClient.wallet(super.lifecycle.targetSigner);
    const expiration = (+sourceNextMessageAccepted.blockTimestamp) + (60 * 60 * 24 * 10);

    const importRootCallData = this.targetOracleContract.buildImportMessageRoot({
      sourceChainId: +sourceNextMessageAccepted.message_fromChainId,
      blockNumber: +sourceNextMessageAccepted.blockNumber,
      messageRoot: queriedRootFromContract,
    });
    const signedMessageHash = this.targetMultisigContract.buildSign({
      oracleContractAddress: super.lifecycle.targetChain.contract.oracle,
      targetChainId: +sourceNextMessageAccepted.message_toChainId,
      expiration: expiration,
      importRootCallData: importRootCallData,
    });
    const signature = await targetSigner.signMessage(ethers.getBytes(signedMessageHash));

    const signcribeData = {
      importRootCallData: importRootCallData,
      expiration: expiration,
    };
    const encodedData = this._encodeSigncribeData(signcribeData);

    const signcribeSubmitOptions = {
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      msgIndex: +sourceNextMessageAccepted.message_index,
      signature: signature,
      data: encodedData,
    };
    const alreadySignedCount = lastSignature.signatures.length;
    const isCollectedSignatures = this._isCompletedSignatures(alreadySignedCount);

    // mainly node will execute multisig
    if (options.mainly) {
      if (isCollectedSignatures) {
        try {
          // console.log(sourceNextMessageAccepted);
          // console.log(signedMessageHash);
          await this.submit(
            lastSignature,
            signcribeData,
            +sourceNextMessageAccepted.message_index
          );
          return;
        } catch (e: any) {
          logger.error(e, super.meta('ormpipe-relay'));
          logger.info(
            'failed to execute multisign will sign message again, %s(%s)',
            sourceNextMessageAccepted.message_index,
            super.sourceName,
            super.meta('ormpipe-relay-oracle', ['oracle:sign']),
          );
        }
      } else {
        logger.info(
          'skip execute transaction for message %s(%s), wait other nodes sign this message, current sign count is %s. %s',
          sourceNextMessageAccepted.message_index,
          super.sourceName,
          alreadySignedCount,
          lastSignature.signatures.map(item => item.signer),
          super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        );
      }
    }

    logger.info(
      'prepare to submit signature for message %s(%s) to %s and last signature state is %s',
      sourceNextMessageAccepted.message_index,
      super.sourceName,
      super.targetName,
      lastSignature.completed,
      super.meta('ormpipe-relay-oracle', ['oracle:sign']),
    );

    const resp = await this.signcribeContract.submit(signcribeSubmitOptions);
    if (!resp) {
      logger.error(
        'failed to submit signed to signcribe contract',
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      return;
    }

    logger.info(
      'message %s(%s) is signed and submit to signcribe: %s',
      sourceNextMessageAccepted.message_index,
      super.sourceName,
      resp?.hash,
      super.meta('ormpipe-relay-oracle', ['oracle:sign']),
    );

  }


  private async submit(
    lastSignature: LastSignature,
    signcribeData: SigncribeData,
    msgIndex: number,
  ) {
    const _signatures = lastSignature.signatures.map(item => {
      return {signer: item.signer, signature: item.signature}
    });
    const _sortedSignatures = _signatures.sort((a, b) => a.signer > b.signer ? 1 : (a.signer < b.signer ? -1 : 0));
    const _keepSortedSignatures = _sortedSignatures.splice(0, 3);
    const _collectedSignatures = _keepSortedSignatures.map(item => item.signature).join('')
      .replaceAll('0x', '');
    const importMessageRootOptions = {
      oracleContractAddress: super.lifecycle.targetChain.contract.oracle,
      importRootCallData: signcribeData.importRootCallData,
      expiration: signcribeData.expiration,
      signatures: `0x${_collectedSignatures}`,
    };

    const executeTxResponse = await this.targetMultisigContract.importMessageRoot(importMessageRootOptions);
    if (!executeTxResponse) {
      logger.warn(
        'no response for submit multisig: %s',
        msgIndex,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      return
    }

    logger.info(
      'multisign transaction executed: (%s) %s ',
      msgIndex,
      executeTxResponse.hash,
      super.meta('ormpipe-relay-oracle', ['oracle:sign']),
    );
    await super.storage.put(OracleRelay.CK_ORACLE_SIGNED, msgIndex);
  }

  private async _lastSignature(chainId: number, msgIndex: number): Promise<LastSignature> {
    // const owners = await this.targetSafeContract.owners();
    const owners = [
      "0xfa5727be643dba6599fc7f812fe60da3264a8205",
      "0xb9a0cadd13c5d534b034d878b2fca9e5a6e1e3a4",
      "0x9f33a4809aa708d7a399fedba514e0a0d15efa85",
      "0x178e699c9a6bb2cd624557fbd85ed219e6faba77",
      "0xa4be619e8c0e3889f5fa28bb0393a4862cad35ad"
    ];
    const topSignatures = await this.indexerSigncribe.topSignatures({
      chainId,
      msgIndex: msgIndex,
      signers: owners,
    });
    if (!topSignatures.length) {
      logger.debug(
        'not have any submitted signature',
        super.meta('ormpipe-relay-oracle', ['oracle:submit']),
      );
      return {
        signatures: [],
        completed: false,
      } as LastSignature;
    }
    const top1Signature = topSignatures[0];
    const checklistSignatures: SignatureSubmittion[] = [];
    for (const tst of topSignatures) {
      if (tst.data != top1Signature.data) continue;
      if (checklistSignatures.findIndex(item => item.signer === tst.signer) != -1) continue;
      checklistSignatures.push(tst);
    }
    const sortedCheckListSignatures = checklistSignatures
      .sort((a, b) => a.signer > b.signer ? 1 : (a.signer < b.signer ? -1 : 0));
    return {
      signatures: sortedCheckListSignatures,
      last: sortedCheckListSignatures[0],
      completed: this._isCompletedSignatures(sortedCheckListSignatures.length),
    };
  }

  private _isCompletedSignatures(count: number): boolean {
    const countNodes = 5;
    const countSc = countNodes * (3 / 5);
    return count >= countSc;
  }

  private _encodeSigncribeData(data: SigncribeData): string {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const encodedData = abiCoder.encode([
        'tuple(bytes importRootCallData, uint256 expiration)'
      ],
      [data]
    );
    return encodedData;
  }

  private _decodeSigncribeData(hex: string): SigncribeData {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const v = abiCoder.decode([
      'tuple(bytes importRootCallData, uint256 expiration)'
    ], hex);
    const decoded = v[0];
    return {
      importRootCallData: decoded[0],
      expiration: decoded[2],
    };
  }

}
