import {ContractConfig, TransactionResponse} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";

const abi = require("../abis/SubAPISignaturePub.json");

export interface SubmitSignscribeOptions {
  chainId: number
  msgIndex: number
  signature: string
  data: string
}


export interface SigncribeData {
  chainId: number
  messageRoot: string
  nonce: number
  blockNumber: number
}

export class SigncribeContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }



  public async submit(options: SubmitSignscribeOptions): Promise<TransactionResponse | undefined> {
    const tx = await this.contract['submit'](
      options.chainId,
      options.msgIndex,
      options.signature,
      options.data,
    )
    return await tx.wait();
  }

}
