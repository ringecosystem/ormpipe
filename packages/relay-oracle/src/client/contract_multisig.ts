import {ContractConfig, TransactionResponse} from "@darwinia/ormpipe-common";
import {ethers, keccak256} from "ethers";

const abi = require("../abis/Multisig.json");

export interface ImportMessageRootOptions {
  oracleContractAddress: string
  importRootCallData: string
  expiration: number
  signatures: string
}

export interface BuildSignOptions {
  oracleContractAddress: string
  targetChainId: number
  expiration: number
  importRootCallData: string
}

export class MultisigContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }


  public buildSign(options: BuildSignOptions): string {
    const toSignData = ethers.AbiCoder.defaultAbiCoder()
      .encode(
        ['uint256', 'address', 'address', 'uint256', 'uint256', 'bytes'],
        [
          options.targetChainId, // target chain id
          this.config.address, // multisig address
          options.oracleContractAddress, // oracleV2 address
          0, // value, 0, don't need pay for it.
          options.expiration, // expiration
          options.importRootCallData, // call importMessageRoot
        ]
      );
    return keccak256(toSignData);
  }

  public async importMessageRoot(options: ImportMessageRootOptions): Promise<TransactionResponse | undefined> {
    const tx = await this.contract['exec'](
      options.oracleContractAddress,
      0,
      options.expiration,
      options.importRootCallData,
      options.signatures,
    );
    return await tx.wait();
  }

  public async getOwners(): Promise<string[]> {
    const owners: string[] = await this.contract['getOwners']();
    return owners.map(item => item.toLowerCase());
  }

}
