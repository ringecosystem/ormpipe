import {ContractClientConfig, TransactionResponse} from "./index";
import {ethers} from "ethers";
import {AirnodeBeacon} from "@darwinia/ormpipe-indexer";
import {logger} from "@darwinia/ormpipe-logger";
const abi = require('../abis/AirnodeDapi.json');


export class AirnodeContractClient {

  private readonly config: ContractClientConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async getRequestFee(): Promise<bigint> {
    logger.debug(
      'call %s -> airnode.getRequestFee',
      this.config.chainName,
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );
    const resp = await this.contract['getRequestFee']();
    return resp[1];
  }

  public async requestFinalizedHash(beacons: AirnodeBeacon[]): Promise<TransactionResponse> {
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
      'call %s -> airnode.requestFinalizedHash %s, {value: %s}',
      this.config.chainName,
      JSON.stringify(bcs),
      requestFee,
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );
    const tx = await this.contract['requestFinalizedHash'](bcs, {value: requestFee});
    return await tx.wait();
  }

  public async aggregateBeacons(beaconIds: string[]): Promise<TransactionResponse> {
    logger.debug(
      'call %s -> airnode.aggregateBeacons %s',
      this.config.chainName,
      JSON.stringify(beaconIds),
      {target: 'ormpipe-relay', breads: ['contract', this.config.chainName]}
    );
    const tx = await this.contract['aggregateBeacons'](beaconIds);
    return await tx.wait();
  }

}
