import {OrmpOracleAssigned, QueryNextOracleAssigned} from "../types/graph";
import {GraphCommon} from "./_common";


export class ThegraphIndexerOracle extends GraphCommon {

  public async allAssignedList(): Promise<OrmpOracleAssigned[]> {
    const query = `
    query QueryNextOracleAssignedList {
      ormpOracleAssigneds(
        orderBy: seq
        orderDirection: asc
      ) {
        id
        msgHash
        fee
        blockNumber
        blockTimestamp
        transactionHash
        seq
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
        orderBy: seq
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
        seq
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpOracleAssigneds'});
  }

  public async lastAssigned(): Promise<OrmpOracleAssigned | undefined> {
    const query = `
    query QueryLastOracleAssigned {
      ormpOracleAssigneds(
        first: 1
        orderBy: seq
        orderDirection: desc
      ) {
        id
        msgHash
        fee
        blockNumber
        blockTimestamp
        transactionHash
        seq
      }
    }
    `;
    return await super.single({query, schema: 'ormpOracleAssigneds'});
  }

}
