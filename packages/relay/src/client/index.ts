import {ethers} from "ethers";
import {AirnodeContractClient} from "./contract_airnode";
import {RelayerContractClient} from "./contract_relayer";
import {logger} from "@darwinia/ormpipe-logger";

export interface RelayClientConfig {
  chainName: string
  endpoint: string
  signer: string
  signerAirnode: string
  signerRelayer: string
}

export interface ContractClientConfig {
  chainName: string
  signer: string
  address: string
  evm: ethers.JsonRpcProvider
}

export interface TransactionResponse {
  from: string
  to: string
  hash: string
  blockHash: string
  blockNumber: string
}

export class RelayClient {

  private readonly _config: RelayClientConfig;
  private readonly _evm: ethers.JsonRpcProvider;

  constructor(config: RelayClientConfig) {
    this._config = config
    this._evm = new ethers.JsonRpcProvider(config.endpoint);
    this._evm.on('debug', info => {
      const {action, payload} = info;
      if (!action) return;
      if (action.indexOf('receive') != -1) {
        return;
      }
      logger.debug(
        JSON.stringify(payload),
        {
          target: 'ormpile-relay',
          breads: [`ethers:${this._config.chainName}`, `${action}`]
        }
      );
    });
  }

  public get config(): RelayClientConfig {
    return this._config;
  }

  public get evm(): ethers.JsonRpcProvider {
    return this._evm
  }

  public airnode(address: string): AirnodeContractClient {
    return new AirnodeContractClient({
      chainName: this.config.chainName,
      signer: this.config.signerAirnode ?? this.config.signer,
      address,
      evm: this.evm
    })
  }

  public relayer(address: string): RelayerContractClient {
    return new RelayerContractClient({
      chainName: this.config.chainName,
      signer: this.config.signerRelayer ?? this.config.signer,
      address,
      evm: this.evm
    });
  }

}

