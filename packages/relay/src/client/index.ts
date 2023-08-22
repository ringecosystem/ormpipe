import {ethers} from "ethers";
import {AirnodeContractClient} from "./contract";

export interface ClientConfig {
  name: string,
  endpoint: string,
}

export class RelayClient {

  private readonly _config: ClientConfig;
  private readonly _jsonProvider: ethers.JsonRpcProvider;
  private readonly _airnodeContractClient: AirnodeContractClient;

  constructor(config: ClientConfig) {
    this._config = config
    this._jsonProvider = new ethers.JsonRpcProvider(config.endpoint);
    this._airnodeContractClient = new AirnodeContractClient();
  }

  public get config(): ClientConfig {
    return this._config;
  }

  public get provider(): ethers.JsonRpcProvider {
    return this._jsonProvider
  }

  public get airnode(): AirnodeContractClient {
    return this._airnodeContractClient
  }

}

