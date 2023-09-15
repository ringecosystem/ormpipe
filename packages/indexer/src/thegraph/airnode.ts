import {GraphCommon} from "./_common";
import {
  AirnodeAggregatedMessageRoot,
  AirnodeBeacon,
  AirnodeBeaconBase,
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

export class ThegraphIndexerAirnode extends GraphCommon {

  public async beacons(): Promise<AirnodeBeacon[]> {
    const query = `
    query QueryBeacons {
      airnodeDapiAddBeacons(
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
      airnodeDapiRemoveBeacons(
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
    const addeds: AirnodeBeacon[] = gdata.list('airnodeDapiAddBeacons');
    const removeds: AirnodeBeaconBase[] = gdata.list('airnodeDapiRemoveBeacons');
    const beaconsSortables: BeaconSortable[] = [
      ...removeds.map(item => {
        return {beaconId: item.beaconId, blockNumber: +item.blockNumber, operation: BeaconOperation.remove};
      }),
      ...addeds.map(item => {
        return {beaconId: item.beaconId, blockNumber: +item.blockNumber, operation: BeaconOperation.add};
      }),
    ];
    beaconsSortables.sort((a, b) => a.blockNumber - b.blockNumber);
    const beacons: AirnodeBeacon[] = [];
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
    query QueryNextAirnodeCompleted($beaconId: Bytes!) {
      airnodeDapiAirnodeRrpCompleteds(
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
    return await super.single({query, variables, schema: 'airnodeDapiAirnodeRrpCompleteds'})
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
      airnodeDapiAggregatedMessageRoots(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgRoot
      }
    }
    `;
    return await super.single({query, schema: 'airnodeDapiAggregatedMessageRoots'});
  }

}
