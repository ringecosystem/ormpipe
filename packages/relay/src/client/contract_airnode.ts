import {ContractClientConfig} from "./index";
import {ethers} from "ethers";
const abi = require('../abis/AirnodeDapi.json');


export class AirnodeContractClient {

  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async requestFinalizedHash() {
    // todo: call airnode requestFinalizedHash
  }

  public async aggregateBeacons(beaconIds: string[]) {
    // todo: call aggregate beacons
  }

}
