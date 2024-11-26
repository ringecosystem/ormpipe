import {ContractConfig, TransactionResponse} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";

const abi = require("../abis/v2/SubAPISignaturePub.json");

export interface SubmitSignscribeOptions {
  chainId: number
  channel: string,
  msgIndex: number
  signature: string
  data: string
}


export interface SigncribeData {
  importRootCallData: string
  expiration: number
}

export class SigncribeContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public get contractConfig() {
    return this.config;
  }

  public async submit(options: SubmitSignscribeOptions): Promise<TransactionResponse | undefined> {
    const tx = await this.contract['submit'](
      options.chainId,
      options.channel,
      options.msgIndex,
      options.signature,
      options.data,
    )
    return await tx.wait();
  }

}
