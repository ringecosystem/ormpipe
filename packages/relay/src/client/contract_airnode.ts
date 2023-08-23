import {ContractClientConfig} from "./index";
import {ethers} from "ethers";
const abi = require('../abis/AirnodeDapi.json');

export class AirnodeContractClient {

  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    const wallet = new ethers.Wallet(config.signer, config.provider);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async requestFinalizedHash() {
    // todo: call airnode requestFinalizedHash
  }



}
