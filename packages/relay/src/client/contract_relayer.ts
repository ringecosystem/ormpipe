import {ContractClientConfig, TransactionResponse} from "./index";
import {ethers} from "ethers";

const abi = require("../abis/OrmpRelayer.json");

export interface OrmpProtocolMessage {
  channel: string
  index: number
  fromChainId: number
  from: string
  toChainId: number
  to: string
  encoded: string
}

export class RelayerContractClient {

  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async relay(message: OrmpProtocolMessage, proof: string, gasLimit: bigint): Promise<TransactionResponse> {
    const tx = await this.contract['relay'](
      message,
      proof,
      gasLimit,
      {
        gasLimit: gasLimit + 200000n,
      }
    );
    return await tx.wait();
  }

}
