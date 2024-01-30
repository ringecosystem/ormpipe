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

  private static CK_ORACLE_SIGNED: string = 'ormpipe.oracle.signed';

  private _targetMultisigContractClient?: MultisigContractClient;
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
    const sourceSignerAddress = super.lifecycle.sourceClient.wallet(this.lifecycle.sourceSigner).address;

    if (!lastSignature.completed) {
      if (lastSignature.signatures.findIndex(item => item.signer.toLowerCase() === sourceSignerAddress.toLowerCase()) > -1) {
        // // # always sign when not completed, because maybe someone signed wrong data
        // logger.info(
        //   'you should wait other nodes to sign message: %s',
        //   sourceNextMessageAccepted.message_index,
        //   super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        // );
        // return;
        logger.info(
          'sign message %s again, wait other nodes to sign this message, current sign count %s',
          sourceNextMessageAccepted.message_index,
          lastSignature.signatures.length,
          super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        );
      }
    }

    // check root by chain rpc
    const queriedRootFromContract = await this.sourceOrmpContract.root({
      blockNumber: +sourceNextMessageAccepted.blockNumber,
    });

    const targetSigner = super.targetClient.wallet(super.lifecycle.targetSigner);

    const expiration = (+sourceNextMessageAccepted.blockTimestamp) + (60 * 60 * 24 * 10);
    const dataToSigned = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        1,
        expiration,
        sourceNextMessageAccepted.message_fromChainId,
        sourceNextMessageAccepted.blockNumber,
        queriedRootFromContract
      ],
    );

    const signature = await targetSigner.signMessage(ethers.getBytes(dataToSigned));

    const signcribeData = {
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      messageRoot: queriedRootFromContract,
      expiration: expiration,
      blockNumber: +sourceNextMessageAccepted.blockNumber,
    };
    const encodedData = this._encodeSigncribeData(signcribeData);

    const signcribeSubmitOptions = {
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      msgIndex: +sourceNextMessageAccepted.message_index,
      signature: signature,
      data: encodedData,
    };

    let alreadySignedCount = lastSignature.signatures.length;
    let shouldAddCurrentSignature = false;
    if (!lastSignature.completed) {
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
      if (lastSignature.signatures.findIndex(item => item.signer.toLowerCase() === sourceSignerAddress.toLowerCase()) == -1) {
        alreadySignedCount += 1
        shouldAddCurrentSignature = true;
      }
    }

    if (!options.mainly) {
      return;
    }

    if (!this._isCompletedSignate(alreadySignedCount)) {
      logger.info(
        'skip execute transaction, wait other nodes sign this message',
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      return;
    }

    const _signatures = lastSignature.signatures.map(item => {
      return {signer: item.signer, signature: item.signature}
    });
    if (shouldAddCurrentSignature) {
      _signatures.push({
        signer: targetSigner.address.toLowerCase(),
        signature: signature,
      });
    }
    const _sortedSignatures = _signatures.sort((a, b) => a.signer > b.signer ? 1 : (a.signer < b.signer ? -1 : 0));
    const _collatedSignatures = _sortedSignatures.map(item => item.signature).join('').replaceAll('0x', '');
    const importMessageRootOptions = {
      chainId: signcribeData.chainId,
      blockNumber: signcribeData.blockNumber,
      messageRoot: signcribeData.messageRoot,
      expiration: signcribeData.expiration,
      signatures: `0x${_collatedSignatures}`,
    };
    // console.log(alreadySignedCount);
    // console.log(lastSignature.signatures);
    // console.log(importMessageRootOptions);
    try {
      const executeTxResponse = await this.targetMultisigContract.importMessageRoot(importMessageRootOptions);
      if (!executeTxResponse) {
        logger.warn(
          'no response for submit multisig: %s',
          sourceNextMessageAccepted.message_index,
          super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        );
        return;
      }

      logger.info(
        'multisign transaction executed: (%s) %s ',
        sourceNextMessageAccepted.message_index,
        executeTxResponse.hash,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );

      await super.storage.put(OracleRelay.CK_ORACLE_SIGNED, sourceNextMessageAccepted.message_index);
    } catch (e: any) {
      logger.error(e, super.meta('ormpipe-relay'));
      // when multisign failed, resign again.
      const resp = await this.signcribeContract.submit(signcribeSubmitOptions);
      if (!resp) {
        logger.error(
          'failed to submit resigned message to signcribe contract',
          super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        );
        return;
      }

      logger.info(
        'message %s(%s) is resigned and submit to signcribe: %s',
        sourceNextMessageAccepted.message_index,
        super.sourceName,
        resp?.hash,
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
    }
  }

  private async _lastSignature(chainId: number, msgIndex: number): Promise<LastSignature> {
    // const owners = await this.targetSafeContract.owners();
    const owners = [
      '0xFa5727bE643dba6599fC7F812fE60dA3264A8205',
      '0xB9a0CaDD13C5d534b034d878b2fcA9E5a6e1e3A4',
      '0x9F33a4809aA708d7a399fedBa514e0A0d15EfA85',
      '0x178E699c9a6bB2Cd624557Fbd85ed219e6faBa77',
      '0xA4bE619E8C0E3889f5fA28bb0393A4862Cad35ad'
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
      completed: this._isCompletedSignate(sortedCheckListSignatures.length),
    };
  }

  private _isCompletedSignate(count: number): boolean {
    const countNodes = 5;
    const countSc = countNodes * (3 / 5);
    return count >= countSc;
  }

  private _encodeSigncribeData(data: SigncribeData): string {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const encodedData = abiCoder.encode([
        'tuple(uint256 chainId, bytes messageRoot, uint256 expiration, uint256 blockNumber)'
      ],
      [data]
    );
    return encodedData;
  }

  private _decodeSigncribeData(hex: string): SigncribeData {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const v = abiCoder.decode([
      'tuple(uint256 chainId, bytes messageRoot, uint256 expiration, uint256 blockNumber)'
    ], hex);
    const decoded = v[0];
    return {
      chainId: decoded[0],
      messageRoot: decoded[1],
      expiration: decoded[2],
      blockNumber: decoded[3],
    };
  }

}
