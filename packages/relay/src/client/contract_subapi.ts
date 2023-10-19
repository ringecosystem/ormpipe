import {ContractClientConfig, TransactionResponse} from "./index";
import {ethers} from "ethers";
import {SubapiBeacon} from "@darwinia/ormpipe-indexer";
import {logger} from "@darwinia/ormpipe-logger";
const abi = require('../abis/Subapi.json');
import chalk = require('chalk');


export class SubapiContractClient {

  private readonly config: ContractClientConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async getRequestFee(): Promise<bigint> {
    logger.debug(
      'call %s -> subapi.getRequestFee',
      this.config.chainName,
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );
    const resp = await this.contract['getRequestFee']();
    return resp[1];
  }

  public async requestFinalizedHash(beacons: SubapiBeacon[]): Promise<TransactionResponse> {
    const requestFee = await this.getRequestFee();
    const bcs = beacons.map(item => {
      return {
        airnode: item.beacon_airnode,
        endpointId: item.beacon_endpointId,
        sponsor: item.beacon_sponsor,
        sponsorWallet: item.beacon_sponsorWallet,
      };
    });
    logger.debug(
      'call %s -> subapi.requestFinalizedHash %s, {value: %s}',
      this.config.chainName,
      chalk.gray(JSON.stringify(bcs)),
      requestFee,
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );
    const tx = await this.contract['requestFinalizedHash'](bcs, {
      value: requestFee,
      gasLimit: 60n * 100000n,
    });
    return await tx.wait();
  }

  public async aggregateBeacons(beaconIds: string[]): Promise<TransactionResponse> {
    logger.debug(
      'call %s -> subapi.aggregateBeacons %s',
      this.config.chainName,
      chalk.gray(JSON.stringify(beaconIds)),
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );
    const tx = await this.contract['aggregateBeacons'](beaconIds);
    return await tx.wait();
  }

}
