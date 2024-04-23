import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";


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

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }


  public buildImportMessageHash(options: BuildImportMessageHashOptions): string {
    return this.contract.interface.encodeFunctionData('importMessageHash', [
      options.sourceChainId, // chainId
      options.channel, // channel
      options.msgIndex, // msgIndex
      options.msgHash // msgHash
    ]);
  }

}
