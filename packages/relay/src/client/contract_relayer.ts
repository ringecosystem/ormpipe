import {ContractClientConfig} from "./index";
import {ethers} from "ethers";
const abi = require("../abis/OrmpRelayer.json");

export class RelayerContractClient {

  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }


}
