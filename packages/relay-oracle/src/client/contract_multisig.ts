import {ContractConfig, TransactionResponse} from "@darwinia/ormpipe-common";
import {ethers} from "ethers";

const abi = require("../abis/Multisig.json");

export interface ImportMessageRootOptions {
  chainId: number
  blockNumber: number
  messageRoot: string
  expiration: number
  signatures: string
}

export class MultisigContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async importMessageRoot(options: ImportMessageRootOptions): Promise<TransactionResponse | undefined> {
    const tx = await this.contract['importMessageRoot'](
      options.expiration,
      options.chainId,
      options.blockNumber,
      options.messageRoot,
      options.signatures
    );
    return await tx.wait();
  }

}
