import {ContractClientConfig, TransactionResponse} from "./index";
import {ethers} from "ethers";
import {logger} from "@darwinia/ormpipe-logger";

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

  private readonly config: ContractClientConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async relay(message: OrmpProtocolMessage, proof: string, gasLimit: bigint): Promise<TransactionResponse> {
    logger.debug(
      'call %s -> relayer.relay',
      this.config.chainName,
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );

    await this.contract['relay'].estimateGas(
      message,
      proof,
      gasLimit,
    );
    const tx = await this.contract['relay'](
      message,
      proof,
      gasLimit,
      {
        gasLimit: gasLimit + 400000n,
      }
    );
    return await tx.wait();
  }

}
