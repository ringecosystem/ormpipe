import { ethers } from "ethers";
import chalk = require("chalk");
import { logger } from "./logger/winston";

const TronWeb = require("tronweb");

export interface RelayClientConfig {
  chainName: string;
  chainId: number;
  endpoint: string;
  signer: string;
}

export interface TransactionResponse {
  from: string;
  to: string;
  hash: string;
  blockHash: string;
  blockNumber: string;
}

export interface ContractConfig {
  chainName: string;
  signer: string;
  address: string;
  evm: ethers.JsonRpcProvider;
  endpoint: string;
}

export class RelayEVMClient {
  private readonly _config: RelayClientConfig;
  private readonly _evm: ethers.JsonRpcProvider;
  private readonly _isTron: boolean;
  private readonly _tronweb: any;

  constructor(config: RelayClientConfig) {
    this._config = config;
    this._evm = new ethers.JsonRpcProvider(config.endpoint);

    if (config.chainName.toLocaleLowerCase().startsWith("tron")) {
      this._isTron = true;
      this._tronweb = new TronWeb({
        fullHost: config.endpoint,
        privateKey: config.signer,
      });
    } else {
      this._isTron = false;
      this._evm.on("debug", (info) => {
        const { action, payload, result } = info;
        if (!action) return;
        const logLevel = process.env.ORMPIPE_LOG_LEVEL ?? "info";
        if (logLevel != "debug") return;
        let logText = "";
        if (action.indexOf("receive") != -1) {
          logText = JSON.stringify(result);
        } else {
          logText = JSON.stringify(payload);
        }
        logger.debug(chalk.gray(logText), {
          target: "ormpipe",
          breads: [`ethers:${this._config.chainName}`, `${action}`],
        });
      });
    }
  }

  public get config(): RelayClientConfig {
    return this._config;
  }

  public get evm(): ethers.JsonRpcProvider {
    return this._evm;
  }

  public get tronweb(): any {
    return this._tronweb;
  }

  public async getLatestBlockNumber() {
    if (this._isTron) {
      const block = await this._tronweb.trx.getCurrentBlock();
      console.log("tronweb getBlock", block);
      return block?.block_header?.raw_data.number;
    } else {
      const block = await this.evm.getBlock("latest", false);
      return block?.number;
    }
  }

  public wallet(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey, this.evm);
  }
}
