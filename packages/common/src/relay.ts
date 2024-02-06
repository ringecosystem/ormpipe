import {RelayBaseLifecycle} from "./types";
import {RelayEVMClient} from "./evm";
import {RelayStorage} from "./storage";

export class CommonRelay<T extends RelayBaseLifecycle> {

  private readonly _lifecycle: T;

  private _sourceChainId?: number;
  private _targetChainId?: number;

  constructor(lifecycle: T,) {
    this._lifecycle = lifecycle;
  }

  public get lifecycle(): T {
    return this._lifecycle
  }

  public get sourceName(): string {
    return this.lifecycle.sourceName
  }

  public get targetName(): string {
    return this.lifecycle.targetName
  }

  public get sourceClient(): RelayEVMClient {
    return this.lifecycle.sourceClient
  }

  public get targetClient(): RelayEVMClient {
    return this.lifecycle.targetClient
  }

  public get storage(): RelayStorage {
    return this.lifecycle.storage
  }

  public async sourceChainId(): Promise<number> {
    if (this._sourceChainId) return this._sourceChainId;
    const sourceNetwork = await this.sourceClient.evm.getNetwork();
    this._sourceChainId = Number(sourceNetwork.chainId);
    return this._sourceChainId;
  }

  public async targetChainId(): Promise<number> {
    if (this._targetChainId) return this._targetChainId;
    const targetNetwork = await this.targetClient.evm.getNetwork();
    this._targetChainId = Number(targetNetwork.chainId);
    return this._targetChainId;
  }

  public meta(target: string, breads?: string[]): any {
    return {
      target,
      breads: [
        `${this.sourceName}>${this.targetName}`,
        ...(breads ?? [])
      ]
    }
  }
}
