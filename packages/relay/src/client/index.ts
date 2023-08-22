import {ethers} from "ethers";

export interface ClientConfig {
  name: string,
  endpoint: string,
}

export class RelayClient {

  private readonly _config: ClientConfig;
  private readonly _jsonProvider: ethers.JsonRpcProvider;

  constructor(config: ClientConfig) {
    this._config = config
    this._jsonProvider = new ethers.JsonRpcProvider(config.endpoint);
  }

  public get config(): ClientConfig {
    return this._config;
  }

  public get provider(): ethers.JsonRpcProvider {
    return this._jsonProvider
  }

}

