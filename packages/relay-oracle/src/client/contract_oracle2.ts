import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";

const abi = require("../abis/Oracle2.json");

export interface ImportMessageRootOptions {
  chainId: number
  blockNumber: number
  messageRoot: string
}

export class Oracle2ContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async buildImportMessageRoot(options: ImportMessageRootOptions) {
    // this.contract.populateTransaction();
    // this.contract['importMessageRoot'](
    //   options.chainId,
    //   options.blockNumber,
    //   options.messageRoot
    // ).serialize().toString("hex")


  }

}
