import {logger} from "@darwinia/ormpipe-logger";
import * as fs from 'node:fs';

const cacache = require('cacache')

interface StorageSchema {
  data: any,
  dataType: string,
}

export class RelayStorage {

  private readonly cachePath: string;

  private initialized: boolean;


  constructor(cachePath: string,) {
    this.cachePath = `${cachePath}/cache`;
    this.initialized = false;
  }

  private get cache() {
    return cacache
  }

  private async initialize() {
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, {recursive: true});
    }
    this.initialized = true;
  }

  public async put(key: string, value: any | undefined) {
    if (!value) return;
    if (!this.initialized) {
      await this.initialize();
    }
    const schema: StorageSchema = {
      data: value,
      dataType: typeof value,
    };
    await this.cache.put(this.cachePath, key, JSON.stringify(schema))
  }

  public async get<T>(key: string): Promise<T | undefined> {
    try {
      const cacheResp = await this.cache.get(this.cachePath, key);
      const cachedData = cacheResp.data;
      if (!cachedData) return;

      const rawData = cachedData.toString();
      const storageSchema: StorageSchema = JSON.parse(rawData);
      const {data, dataType} = storageSchema;

      switch (dataType) {
        case 'string':
          return data;
        case 'number':
          return (+data) as unknown as T;
        case 'bigint':
          return BigInt(data) as unknown as T;
        default:
          return data;
      }
    } catch (e: any) {
      const msg = e.message;
      const _msg = msg ? msg.replaceAll(' ', '').toLowerCase() : '';
      if (_msg.indexOf('nocacheentry') != -1) {
        return;
      }
      console.error(e);
    }
  }

  public async remove(key: string) {
    await this.cache.rm.entry(this.cachePath, key);
  }


}
