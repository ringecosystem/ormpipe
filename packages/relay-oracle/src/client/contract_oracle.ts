import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";
const TronWeb = require("tronweb");

const abi = require("../abis/v2/Oracle.json");

export interface BuildImportMessageHashOptions {
  sourceChainId: number
  channel: string
  msgIndex: number,
  msgHash: string
}

export class OracleContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;
  private _tronweb: any;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
    if(this.config.chainName.toLowerCase().startsWith("tron")) {
        this._tronweb = new TronWeb({
          fullHost: this.config.endpoint,
          privateKey: this.config.signer,
        });
    }
  }


  public buildImportMessageHash(options: BuildImportMessageHashOptions): string {
    if(this._tronweb) {
      const encodeTronImportMessageHash = this._tronweb.utils.abi.encodeParamsV2ByABI(abi[11], [
        options.sourceChainId, // chainId
        options.channel, // channel
        options.msgIndex, // msgIndex
        options.msgHash // msgHash
      ]);
      console.log("encodeTronImportMessageHash", encodeTronImportMessageHash);
      return encodeTronImportMessageHash;
    } else {
      return this.contract.interface.encodeFunctionData('importMessageHash', [
        options.sourceChainId, // chainId
        options.channel, // channel
        options.msgIndex, // msgIndex
        options.msgHash // msgHash
      ]);
    }
  }

}
