import {BaseLifecycle} from "../types/lifecycle";
import {RelayClient} from "../client";
import {RelayStorage} from "../helper/storage";

export class CommonRelay<T extends BaseLifecycle> {

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

  public get sourceClient(): RelayClient {
    return this.lifecycle.sourceClient
  }

  public get targetClient(): RelayClient {
    return this.lifecycle.targetClient
  }

  public get storage(): RelayStorage {
    return this.lifecycle.storage
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

