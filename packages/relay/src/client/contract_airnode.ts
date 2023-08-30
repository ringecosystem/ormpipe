import {ContractClientConfig, TransactionResponse} from "./index";
import {ethers} from "ethers";
import {AirnodeBeacon} from "@darwinia/ormpipe-indexer/dist/types/graph";
const abi = require('../abis/AirnodeDapi.json');


export class AirnodeContractClient {

  private readonly contract: ethers.Contract;

  constructor(config: ContractClientConfig) {
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async getRequestFee(): Promise<BigInt> {
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
    const tx = await this.contract['requestFinalizedHash'](bcs, {value: requestFee});
    return await tx.wait();
  }

  public async aggregateBeacons(beaconIds: string[]): Promise<TransactionResponse> {
    const tx = await this.contract['aggregateBeacons'](beaconIds);
    return await tx.wait();
  }

}
