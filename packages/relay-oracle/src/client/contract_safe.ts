import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";

const abi = require("../abis/Safe.json");


export interface QuerySafeNonceOptions {
  blockNumber: number
}

export class SafeContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async nonce(): Promise<number> {

    return 1;
  }

}
