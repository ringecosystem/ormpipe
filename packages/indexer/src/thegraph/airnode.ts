import {GraphCommon} from "./_common";
import {AirnodeBeacon, AirnodeBeaconBase} from "../types/graph";

export class ThegraphIndexerAirnode extends GraphCommon {

  public async beacons(): Promise<AirnodeBeacon[]> {
    const query = `
    query QueryBeacons {
      addBeacons(
        orderBy: blockNumber
        orderDirection: asc
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        beaconId
        beacon_airnode
        beacon_endpointId
        beacon_sponsor
        beacon_sponsorWallet

      }
      removeBeacons(
        orderBy: blockNumber
        orderDirection: asc
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        beaconId
      }
    }
    `;
    const gdata = await super.query({query});
    const addeds: AirnodeBeacon[] = gdata.list('addBeacons');
    const removeds: AirnodeBeaconBase[] = gdata.list('removeBeacons');
    return addeds.filter(ai => removeds.findIndex(ri => ri.beaconId == ai.beaconId) == -1);
  }

}
