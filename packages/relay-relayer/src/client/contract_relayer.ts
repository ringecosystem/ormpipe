import {ethers} from "ethers";
import {ContractConfig, logger, TransactionResponse} from "@darwinia/ormpipe-common";

const abi = require("../abis/OrmpRelayer.json");

export interface OrmpProtocolMessage {
  channel: string
  index: number
  fromChainId: number
  from: string
  toChainId: number
  to: string
  gasLimit: bigint
  encoded: string
}

export interface RelayOptions {
  message: OrmpProtocolMessage
  proof: string
  gasLimit: bigint
  enableGasCheck: boolean
}

export class RelayerContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async relay(options: RelayOptions): Promise<TransactionResponse | undefined> {
    logger.debug(
      'call %s -> relayer.relay',
      this.config.chainName,
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );

    // if (options.enableGasCheck) {
    //   const estimatedGas = await this.contract['relay'].estimateGas(
    //     options.message,
    //     options.proof,
    //   );
    //   if (estimatedGas / options.gasLimit > 1.5) {
    //     logger.debug(
    //       'estimated gas large than provide gaslimit 50%, [%s, %s]',
    //       estimatedGas,
    //       options.gasLimit,
    //       {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    //     );
    //     return;
    //   }
    // }
    // const contractOptions = options.enableGasCheck
    //   ? {}
    //   : {
    //     gasLimit: options.gasLimit,
    //   };
    const tx = await this.contract['relay'](
      options.message,
      options.proof,
      // contractOptions,
    );
    return await tx.wait();
  }

  public async configOf(chainId: number): Promise<bigint> {
    const configOf = await this.contract['configOf'](chainId);
    return configOf[0];
  }

}
