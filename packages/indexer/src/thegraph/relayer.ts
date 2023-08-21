import {OrmpRelayerAssigned, QueryNextRelayerAssigned} from "../types/graph";
import {GraphCommon} from "./_common";

export class GraphRelayer extends GraphCommon {

  public async nextAssigned(variables: QueryNextRelayerAssigned): Promise<OrmpRelayerAssigned | undefined> {
    const query = `
    query NextRelayerAssigned($blockNumber: BigInt!) {
      ormpRelayerAssigneds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          blockNumber_gt: $blockNumber
        }
      ) {
        id
        msgHash
        fee
        parmas
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpRelayerAssigneds'});
  }

}
