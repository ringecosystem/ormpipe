import {GraphCommon} from "./_common";
import {
  AirnodeAggregatedMessageRoot,
  SubapiBeacon,
  SubapiBeaconBase,
  AirnodeBeaconCompletedDistruibution,
  AirnodeComplted,
  QueryNextAirnodeCompleted
} from "../types/graph";

enum BeaconOperation {
  add = 'add',
  remove = 'remove',
}

interface BeaconSortable {
  beaconId: string
  blockNumber: number
  operation: BeaconOperation,
}

export class ThegraphIndexerSubapi extends GraphCommon {

  public async beacons(): Promise<SubapiBeacon[]> {
    const query = `
    query QueryBeacons {
      subapiAddBeacons(
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
      subapiRemoveBeacons(
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
    const addeds: SubapiBeacon[] = gdata.list('subapiAddBeacons');
    const removeds: SubapiBeaconBase[] = gdata.list('subapiRemoveBeacons');
    const beaconsSortables: BeaconSortable[] = [
      ...removeds.map(item => {
        return {beaconId: item.beaconId, blockNumber: +item.blockNumber, operation: BeaconOperation.remove};
      }),
      ...addeds.map(item => {
        return {beaconId: item.beaconId, blockNumber: +item.blockNumber, operation: BeaconOperation.add};
      }),
    ];
    beaconsSortables.sort((a, b) => a.blockNumber - b.blockNumber);
    const beacons: SubapiBeacon[] = [];
    for (const bsa of beaconsSortables) {
      switch (bsa.operation) {
        case BeaconOperation.add:
          const beaconAdd = addeds.find(
            item => item.beaconId == bsa.beaconId && +item.blockNumber == bsa.blockNumber
          )
          if (beaconAdd) {
            beacons.push(beaconAdd);
          }
          break;
        case BeaconOperation.remove:
          beacons.splice(
            beacons.findIndex(item => item.beaconId == bsa.beaconId),
            1
          );
          break;
      }
    }
    return beacons;
  }

  public async lastAirnodeCompleted(variables: QueryNextAirnodeCompleted): Promise<AirnodeComplted | undefined> {
    const query = `
    query QueryLastAirnodeCompleted($beaconId: Bytes!) {
      subapiAirnodeRrpCompleteds(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
        where: {
          beaconId: $beaconId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        beaconId
        requestId
        data
      }
    }
    `;
    return await super.single({query, variables, schema: 'subapiAirnodeRrpCompleteds'})
  }

  public async beaconAirnodeCompletedDistribution(beacons: string[]): Promise<AirnodeBeaconCompletedDistruibution[]> {
    const completeds = [] as AirnodeBeaconCompletedDistruibution[];
    for (const beaconId of beacons) {
      const c = await this.lastAirnodeCompleted({beaconId});
      if (!c) continue;
      completeds.push(c);
    }
    return completeds;
  }

  public async lastAggregatedMessageRoot(): Promise<AirnodeAggregatedMessageRoot | undefined> {
    const query = `
    query QueryLastAggregatedMessageRoot {
      subapiAggregatedORMPDatas(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        ormpData_root
        ormpData_count
      }
    }
    `;
    return await super.single({query, schema: 'subapiAggregatedORMPDatas'});
  }

}
