import {ethers} from "ethers";
import {AirnodeContractClient} from "./contract_airnode";
import {RelayerContractClient} from "./contract_relayer";

export interface RelayClientConfig {
  name: string
  endpoint: string
  signer: string
  signerAirnode: string
  signerRelayer: string
}

export interface ContractClientConfig {
  signer: string
  address: string
  evm: ethers.JsonRpcProvider
}

export class RelayClient {

  private readonly _config: RelayClientConfig;
  private readonly _evm: ethers.JsonRpcProvider;

  constructor(config: RelayClientConfig) {
    this._config = config
    this._evm = new ethers.JsonRpcProvider(config.endpoint);
  }

  public get config(): RelayClientConfig {
    return this._config;
  }

  public get evm(): ethers.JsonRpcProvider {
    return this._evm
  }

  public airnode(address: string): AirnodeContractClient {
    return new AirnodeContractClient({
      signer: this.config.signerAirnode ?? this.config.signer,
      address,
      evm: this.evm
    })
  }

  public relayer(address: string): RelayerContractClient {
    return new RelayerContractClient({
      signer: this.config.signerRelayer ?? this.config.signer,
      address,
      evm: this.evm
    });
  }

}

