import {OrmpOracleAssigned, OrmpRelayerAssigned, QueryNextRelayerAssigned} from "../types/graph";
import {GraphCommon} from "./_common";

export class ThegraphIndexerRelayer extends GraphCommon {

  public async allAssignedList(): Promise<OrmpRelayerAssigned[]> {
    const query = `
    query QueryRelayerAssignedList($msgHash: Bytes!) {
      ormpRelayerAssigneds(
        orderBy: blockNumber
        orderDirection: asc
      ) {
        id
        msgHash
        fee
        params
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.list({query, schema: 'ormpRelayerAssigneds'});
  }

  public async inspectAssigned(variables: QueryNextRelayerAssigned): Promise<OrmpRelayerAssigned | undefined> {
    const query = `
    query QueryRelayerAssigned($msgHash: Bytes!) {
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
        params
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpRelayerAssigneds'});
  }

}
