import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";

const abi = require("../abis/Ormp.json");

export interface OrmpRootOptions {
  blockNumber: number
}

export class OrmpContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async root(options: OrmpRootOptions): Promise<string> {
    console.log(this.config)
    return await this.contract['root']({blockTag: 0x482853}); //
  }

}
