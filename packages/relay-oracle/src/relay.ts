import {OracleRelayLifecycle} from "./types/config";
import {CommonRelay, logger} from "@darwinia/ormpipe-common";
import {OrmpMessageAccepted, SignatureSubmittion, ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {Oracle2ContractClient} from "./client/contract_oracle2";
import {SigncribeContractClient, SigncribeData, SubmitSignscribeOptions} from "./client/contract_signcribe";
import {ThegraphIndexSigncribe} from "@darwinia/ormpipe-indexer/dist/thegraph/signcribe";

const Safe = require('@safe-global/protocol-kit');
import {AbiCoder, ethers} from "ethers";
import {SafeSignature} from "@safe-global/safe-core-sdk-types";
import {SafeContractClient} from "./client/contract_safe";
import {OrmpContractClient} from "./client/contract_ormp";

interface OracleSignOptions {
  sourceChainId: number
  targetChainId: number
  mainly: boolean
}

interface OracleSubmitOptions {
  safe: any,
  transaction: any,
}

interface LastSignature {
  signatures: SignatureSubmittion[],
  last?: SignatureSubmittion,
  completed: boolean
}

export class OracleRelay extends CommonRelay<OracleRelayLifecycle> {

  private static CK_ORACLE_SIGNED: string = 'ormpipe.oracle.signed';
  private static CK_ORACLE_AGGREGATED: string = 'ormpipe.oracle.aggregated';
  private static CK_ORACLE_MARK_AGGREGATED_MESSAGE_COUNT: string = 'ormpipe.oracle.mark.aggregated_message_count';

  private _targetOracle2ContractClient?: Oracle2ContractClient;
  private _signcribeContractClient?: SigncribeContractClient;
  private _safeContractClient?: SafeContractClient;
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

  public get targetOracle2Contract(): Oracle2ContractClient {
    if (this._targetOracle2ContractClient) return this._targetOracle2ContractClient;
    this._targetOracle2ContractClient = new Oracle2ContractClient({
      chainName: super.targetName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.oracle2,
      evm: super.sourceClient.evm,
    });
    return this._targetOracle2ContractClient;
  }

  public get targetSafeContract(): SafeContractClient {
    if (this._safeContractClient) return this._safeContractClient;
    this._safeContractClient = new SafeContractClient({
      chainName: super.targetName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.safe,
      evm: super.sourceClient.evm,
    });
    return this._safeContractClient;
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
      evm: super.lifecycle.sourceClient.evm,
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
    const msgHashes = await this.sourceIndexerOrmp.pickOracleAssignedMessageHashes({
      toChainId: options.targetChainId,
    });
    let sourceNextMessageAccepted;
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
      sourceNextMessageAccepted = await this.sourceIndexerOrmp.inspectMessageAccepted({
        msgHash: unRelayedMessagesQueriedFromTarget[0],
      });
    } else {
      sourceNextMessageAccepted = await this.sourceIndexerOrmp.nextMessageAccepted({
        messageIndex: -1,
        toChainId: options.targetChainId,
      });
    }
    if (sourceNextMessageAccepted) {
      return sourceNextMessageAccepted;
    }

    const sourceLastOracleMessageAssigned = await this.sourceIndexerOrmp.lastOracleAssigned({
      toChainId: options.targetChainId,
    });
    if (sourceLastOracleMessageAssigned) {
      await super.storage.put(OracleRelay.CK_ORACLE_SIGNED, sourceLastOracleMessageAssigned.message_index);
    }
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
    logger.debug(
      'message block finalized %s/%s(%s)',
      sourceFinalizedBLock.number,
      sourceNextMessageAccepted.blockNumber,
      super.sourceName,
      super.meta('ormpipe-relay-oracle', ['oracle:sign']),
    );

    // check sign progress
    const lastSignature = await this._lastSignature(+sourceNextMessageAccepted.message_fromChainId);
    if (!lastSignature.completed) {
      const sourceSignerAddress = super.lifecycle.sourceClient.wallet(this.lifecycle.sourceSigner).address;
      if (lastSignature.signatures.findIndex(item => item.signer.toLowerCase() === sourceSignerAddress.toLowerCase()) > -1) {
        logger.info(
          'you should wait other nodes to sign message',
          super.meta('ormpipe-relay-oracle', ['oracle:sign']),
        );
        return;
      }
    }


    const safeNonce = await this.targetSafeContract.nonce();

    // check root by chain rpc
    const queriedRootFromContract = await this.sourceOrmpContract.root({
      blockNumber: +sourceNextMessageAccepted.blockNumber,
    });

    const txcaller = await this.targetOracle2Contract.buildImportMessageRoot({
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      blockNumber: +sourceNextMessageAccepted.blockNumber,
      messageRoot: queriedRootFromContract,
    });
    const safeTransactionData = {
      to: super.lifecycle.targetChain.contract.oracle2, // oracle v2 contract address
      value: '0',
      data: txcaller,
    }

    const _signer = super.targetClient.wallet(super.lifecycle.targetSigner);
    const safeSdk = await Safe.default.create({
      ethAdapter: new Safe.EthersAdapter({
        ethers,
        signerOrProvider: _signer
      }),
      safeAddress: super.lifecycle.targetChain.contract.safe,
    });


    const safeTransaction = await safeSdk.createTransaction({
        transactions: [safeTransactionData],
        options: {nonce: safeNonce},
      }
    );

    // console.log(safeTransactionData);
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    const senderSignature: SafeSignature = await safeSdk.signTransactionHash(safeTxHash);

    const signcribeData = {
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      messageRoot: queriedRootFromContract,
      nonce: safeNonce,
      blockNumber: +sourceNextMessageAccepted.blockNumber,
    };
    const encodedData = this._encodeSigncribeData(signcribeData);

    const signcribeSubmitOptions = {
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      signature: senderSignature.data,
      data: encodedData,
    };


    let alreadySignedCount = lastSignature.signatures.length;
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
      alreadySignedCount += 1;
    }

    if (!options.mainly) {
      return;
    }

    if (!this._isCompletedSignate(alreadySignedCount)) {
      logger.info(
        'skip execute safe transaction, wait other nodes sign this message',
        super.meta('ormpipe-relay-oracle', ['oracle:sign']),
      );
      return;
    }

    safeTransaction.signatures = [];
    for (const signature of lastSignature.signatures) {
      safeTransaction.signatures.push({signer: signature.signer, data: signature.signature});
    }
    safeTransaction.signatures.push({
      signer: _signer.address.toLowerCase(),
      data: encodedData,
    } as SignatureSubmittion);

    const executeTxResponse = await safeSdk.executeTransaction(safeTransaction)
    console.log(executeTxResponse);

    /*
    // tron
    const tronWeb = new TronWeb({
                fullHost: 'https://api.shasta.trongrid.io',
                privateKey: tronPrivateKey
            })
            const oracleV2addr = tronWeb.address.toHex("TDACQR5FUtNpuBS2g85WKiucvrAWhY6zzs");
            const functions = "importMessageRoot(uint256,uint256,bytes32)";
            var parameter = [{ type: 'uint256', value: 42416 }, { type: 'uint256', value: 1 }, { type: 'bytes32', value: `0x0000000000000000000000000000000000000000000000000000000000000001` }];
            const subapiDao = tronWeb.address.toHex("TKXAuEtPiqa49vnuoBQQDURUzCB7SnXb4y");

            const options = {
                feeLimit: 100000000,
                callValue: 0,
                Permission_id: 0
            }

            const initTx = await tronWeb.transactionBuilder.triggerSmartContract(oracleV2addr, functions, options, parameter, subapiDao);
            const unsignedTx = await tronWeb.transactionBuilder.extendExpiration(initTx.transaction, 1800);

            var signedTransaction = await tronWeb.trx.multiSign(unsignedTx);
            console.log("signedTransaction", JSON.stringify(signedTransaction));

            // const signedTransaction = "";

            var signWeight = await tronWeb.trx.getSignWeight(signedTransaction);
            console.log("signWeight", signWeight);

            // var approvedList = await tronWeb.trx.getApprovedList(signedTransaction);
            // console.log("approvedList", approvedList);

            // var result = await tronWeb.trx.broadcast(signedTransaction);
            // console.log("result", result);
     */

    await super.storage.put(OracleRelay.CK_ORACLE_SIGNED, sourceNextMessageAccepted.message_index);
  }


  private async _lastSignature(chainId: number): Promise<LastSignature> {
    const topSignatures = await this.indexerSigncribe.topSignatures({chainId, limit: 10});
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
    return {
      signatures: checklistSignatures,
      last: checklistSignatures[0],
      completed: this._isCompletedSignate(checklistSignatures.length),
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
        'tuple(uint256 chainId, bytes messageRoot, uint256 nonce, uint256 blockNumber)'
      ],
      [data]
    );
    return encodedData;
  }

  private _decodeSigncribeData(hex: string): SigncribeData {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const v = abiCoder.decode([
      'tuple(uint256 chainId, bytes messageRoot, uint256 nonce, uint256 blockNumber)'
    ], hex);
    const decoded = v[0];
    return {
      chainId: decoded[0],
      messageRoot: decoded[1],
      nonce: decoded[2],
      blockNumber: decoded[3],
    };
  }

}
