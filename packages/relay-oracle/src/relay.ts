import {OracleRelayLifecycle} from "./types/config";
import {CommonRelay, logger} from "@darwinia/ormpipe-common";
import {OrmpMessageAccepted, ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {Oracle2ContractClient} from "./client/contract_oracle2";
import {SigncribeContractClient, SubmitSignscribeOptions} from "./client/contract_signcribe";
import {ThegraphIndexSigncribe} from "@darwinia/ormpipe-indexer/dist/thegraph/signcribe";

const Safe = require('@safe-global/protocol-kit');
import {AbiCoder, ethers} from "ethers";
import {SafeSignature} from "@safe-global/safe-core-sdk-types";

interface OracleRelayOptions {
  sourceChainId: number
  targetChainId: number
}

export class OracleRelay extends CommonRelay<OracleRelayLifecycle> {

  private static CK_ORACLE_DELIVERIED: string = 'ormpipe.oracle.deliveried';
  private static CK_ORACLE_AGGREGATED: string = 'ormpipe.oracle.aggregated';
  private static CK_ORACLE_MARK_AGGREGATED_MESSAGE_COUNT: string = 'ormpipe.oracle.mark.aggregated_message_count';

  private _targetOracle2ContractClient?: Oracle2ContractClient;
  private _signcribeContractClient?: SigncribeContractClient;

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
      chainName: super.sourceName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.relayer,
      evm: super.sourceClient.evm,
    });
    return this._targetOracle2ContractClient;
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


  public async start() {
    try {
      const sourceChainId = await super.sourceChainId();
      const targetChainId = await super.targetChainId();

      const options: OracleRelayOptions = {
        sourceChainId,
        targetChainId,
      };
      await this.sign(options);

      if (!super.lifecycle.mainly) {
        return;
      }
      await this.submit(options);
    } catch (e: any) {
      logger.error(e, super.meta('ormpipe-relay'));
    }
  }

  private async _lastAssignedMessageAccepted(options: OracleRelayOptions): Promise<OrmpMessageAccepted | undefined> {
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
      await super.storage.put(OracleRelay.CK_ORACLE_DELIVERIED, sourceLastOracleMessageAssigned.message_index);
    }
  }


  private async sign(options: OracleRelayOptions) {
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
      await super.storage.put(OracleRelay.CK_ORACLE_DELIVERIED, sourceNextMessageAccepted.message_index);
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


    // sign
    // super.lifecycle.targetClient.evm.

    // this.targetOracle2Client
    const safeTransactionData = {
      to: super.lifecycle.targetChain.contract.oracle2, // oracle v2 contrace address
      value: '0',
      data: '0x', // abi encode importMessageProof
    }

    const _signer = super.targetClient.wallet(super.lifecycle.targetSigner);
    const safeSdk = await Safe.default.create({
      ethAdapter: new Safe.EthersAdapter({
        ethers,
        signerOrProvider: _signer
      }),
      safeAddress: "0x000000000a0D8ac9cc6CbD817fA77090322FF29d"
    })

    const safeTransaction = await safeSdk.createTransaction({
        transactions: [safeTransactionData],
        options: {nonce: 1}
      }
    );

    // console.log(safeTransactionData);
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    const senderSignature: SafeSignature = await safeSdk.signTransactionHash(safeTxHash);

    const abiCoder = AbiCoder.defaultAbiCoder();
    const encodedData = abiCoder.encode([
        'tuple(uint256 chainId, bytes messageRoot, uint256 nonce, uint256 blockNumber)'
      ],
      [
        {
          chainId: sourceNextMessageAccepted.message_fromChainId,
          messageRoot: sourceNextMessageAccepted.root,
          nonce: 1,
          blockNumber: sourceNextMessageAccepted.blockNumber
        }
      ]
    );

    const resp = await this.signcribeContract.submit({
      chainId: +sourceNextMessageAccepted.message_fromChainId,
      signature: senderSignature.data,
      data: encodedData
    });
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

    // safeTransaction.signatures = [];
    // [
    //   {
    //     signer: '0x9F33a4809aA708d7a399fedBa514e0A0d15EfA85',
    //     data: '0x8f90c6f9bdde7adcd240b7c17cd1568590a64567dbe7ff1106124285b0bec7fe0bf4c5f74f4f5be8a0f8a2f55d1f72eb112b21eeb318590cb41a5707869806791f'
    //   },
    //   {
    //     signer: '0x178E699c9a6bB2Cd624557Fbd85ed219e6faBa77',
    //     data: '0x51d92c0d1977541ca705f6b17d6fc7bc0eed26ef49a868a8c760f6a04ee4e820737dfb599bd14b2c73ee50e433b989d0bc5039b380a494829e3412726a37f82e1f'
    //   },
    //   {
    //     signer: '0xA4bE619E8C0E3889f5fA28bb0393A4862Cad35ad',
    //     data: '0xfbdfd00be788c8b03ae12e112b713d9a5abbb78b361da3724db9ddebe11a414172eb322eaaf983d2b341e993199d27e38af59ebe70b9fe41dca19501bc48fab51f'
    //   }
    // ].forEach(item => {
    //   safeTransaction.signatures.push(new Safe.EthSafeSignature(item.signer, item.data));
    // })
    // console.log("safeTransaction", safeTransaction);
    //
    // const executeTxResponse = await safeSdk.executeTransaction(safeTransaction)


    // todo: sign message

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

    await super.storage.put(OracleRelay.CK_ORACLE_DELIVERIED, sourceNextMessageAccepted.message_index);
  }

  private async submit(options: OracleRelayOptions) {
    console.log('submit');
  }

}
