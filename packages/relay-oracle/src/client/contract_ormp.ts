import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers, EventLog, Log} from "ethers";

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
    const filters = this.contract.filters.MessageAccepted;
    const events: Array<EventLog | Log> = await this.contract.queryFilter(filters, options.blockNumber, options.blockNumber);
    const firstBlockEvent = events[0];
    return firstBlockEvent.data.substring(0, 66);
  }

}
