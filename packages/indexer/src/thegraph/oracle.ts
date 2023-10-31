import {OrmpOracleAssigned, QueryNextOracleAssigned} from "../types/graph";
import {GraphCommon} from "./_common";


export class ThegraphIndexerOracle extends GraphCommon {

  public async allAssignedList(): Promise<OrmpOracleAssigned[]> {
    const query = `
    query QueryNextOracleAssignedList($skip: BigInt!) {
      ormpOracleAssigneds(
        skip: $skip
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
    const assignedList: OrmpOracleAssigned[] = [];
    let skip = 0;
    while (true) {
      const variables = {skip};
      const parts: OrmpOracleAssigned[] = await super.list({query, variables, schema: 'ormpOracleAssigneds'});
      const length = parts.length;
      if (length == 0) {
        return assignedList;
      }
      assignedList.push(...parts);
      skip += length;
    }
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
