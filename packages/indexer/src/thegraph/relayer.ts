import {OrmpRelayerAssigned, QueryNextRelayerAssigned} from "../types/graph";
import {GraphCommon} from "./_common";

export class ThegraphIndexerRelayer extends GraphCommon {

  public async nextAssigned(variables: QueryNextRelayerAssigned): Promise<OrmpRelayerAssigned | undefined> {
    const query = `
    query NextRelayerAssigned($msgHash: Bytes!) {
      ormpRelayerAssigneds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          msgHash: $msgHash
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
