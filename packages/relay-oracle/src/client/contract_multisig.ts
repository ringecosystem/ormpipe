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
  chainId: number
  expiration: number
  messageIndex: number
  messageRoot: string
}

export interface BuildSignResult {
  hash: string
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


  public buildSign(options: BuildSignOptions): BuildSignResult {
    const importRootCallData = this.contract.interface.encodeFunctionData('importMessageRoot', [
      options.chainId, // chainId
      options.messageIndex, // messageIndex
      options.messageRoot, // messageRoot
    ]);
    const toSignData = ethers.AbiCoder.defaultAbiCoder()
      .encode(
        ['address', 'uint256', 'uint256', 'bytes'],
        [
          options.oracleContractAddress, // oracleV2 address
          0, // value, 0, don't need pay for it.
          options.expiration, // expiration
          importRootCallData, // call importMessageRoot
        ]
      );
    return {
      hash: keccak256(toSignData),
      importRootCallData,
    };
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

}
