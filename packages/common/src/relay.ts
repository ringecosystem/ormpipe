import {RelayBaseLifecycle} from "./types";
import {RelayEVMClient} from "./evm";
import {RelayStorage} from "./storage";

export class CommonRelay<T extends RelayBaseLifecycle> {

  private readonly _lifecycle: T;

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
    return this.lifecycle.sourceChain.chainId;
  }

  public async targetChainId(): Promise<number> {
    return this.lifecycle.targetChain.chainId;
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
