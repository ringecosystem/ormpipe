import { ethers } from "ethers";
import {
  ContractConfig,
  logger,
  TransactionResponse,
} from "@darwinia/ormpipe-common";
const TronWeb = require("tronweb");

const abi = require("../abis/v2/Relayer.json");

export interface OrmpProtocolMessage {
  channel: string;
  index: number;
  fromChainId: number;
  from: string;
  toChainId: number;
  to: string;
  gasLimit: bigint;
  encoded: string;
}

export interface RelayOptions {
  message: OrmpProtocolMessage;
  gasLimit: bigint;
  chainId: number;
}

interface EthersRequestOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  type?: number;
}

export class RelayerContractClient {
  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;
  private _tronContract: any;
  private _tronweb: any;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
    if (this.config.chainName.toLowerCase().startsWith("tron")) {
      this._tronweb = new TronWeb({
        fullHost: this.config.endpoint,
        privateKey: this.config.signer,
      });
    }
  }

  public async relay(
    options: RelayOptions
  ): Promise<TransactionResponse | undefined> {
    logger.debug("call %s -> relayer.relay", this.config.chainName, {
      target: "ormpipe-relay",
      breads: ["contract", this.config.chainName],
    });

    // if (options.enableGasCheck) {
    //   const estimatedGas = await this.contract['relay'].estimateGas(
    //     options.message,
    //     options.proof,
    //   );
    //   if (estimatedGas / options.gasLimit > 1.5) {
    //     logger.info(
    //       'estimated gas large than provide gaslimit 50%, [%s, %s]',
    //       estimatedGas,
    //       options.gasLimit,
    //       {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    //     );
    //     return;
    //   }
    // }
    const contractOptions: EthersRequestOptions = {};

    const enableGasCheck =
      [
        421614, // arbitrum sepolia
        42161, // arbitrum one
      ].indexOf(options.chainId) > -1;
    if (enableGasCheck) {
      const estimatedGas = await this.contract["relay"].estimateGas(
        options.message
      );
      contractOptions.gasLimit = estimatedGas + estimatedGas;
    } else {
      contractOptions.gasLimit = options.gasLimit;
    }
    switch (options.chainId) {
      case 42161: // arbitrum
        contractOptions.maxFeePerGas = BigInt(300000000);
        contractOptions.maxPriorityFeePerGas = BigInt(100000000);
        break;
      case 81457: // blast
        contractOptions.type = 0;
        break;
    }
    if (this._tronweb) {
      if (!this._tronContract) {
        this._tronContract = await this._tronweb.contract(
          abi,
          this.config.address.replace("0x", "41")
        );
      }
      try {
        const tronResult = await this._tronContract
          .relay([
            options.message.channel,
            options.message.index,
            options.message.fromChainId,
            options.message.from,
            options.message.toChainId,
            options.message.to,
            options.message.gasLimit,
            options.message.encoded,
          ])
          .send();

        console.log("Relay on Tron", tronResult);
        return tronResult;
      } catch (e) {
        console.error(e);
      }
    } else {
      const tx = await this.contract["relay"](options.message, contractOptions);
      return await tx.wait();
    }
  }

  public async configOf(chainId: number): Promise<bigint> {
    if (this._tronweb) {
      if (!this._tronContract) {
        this._tronContract = await this._tronweb.contract(
          abi,
          this.config.address.replace("0x", "41")
        );
      }
      const configOf = await this._tronContract["configOf"](chainId).call();
      return BigInt(configOf[0]._hex);
    } else {
      const configOf = await this.contract["configOf"](chainId);
      return configOf[0];
    }
  }
}
