import {OrmpOracleAssigned, QueryNextOracleAssigned} from "../types/graph";
import {GraphCommon} from "./_common";


export class ThegraphIndexerOracle extends GraphCommon {

  public async allAssignedList(): Promise<OrmpOracleAssigned[]> {
    const query = `
    query QueryNextOracleAssignedList {
      ormpOracleAssigneds(
        orderBy: blockNumber
        orderDirection: asc
      ) {
        id
        msgHash
        fee
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.list({query, schema: 'ormpOracleAssigneds'});
  }

  public async inspectAssigned(variables: QueryNextOracleAssigned): Promise<OrmpOracleAssigned | undefined> {
    const query = `
    query QueryNextOracleAssigned($msgHash: Bytes!) {
      ormpOracleAssigneds(
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
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpOracleAssigneds'})
  }

}
