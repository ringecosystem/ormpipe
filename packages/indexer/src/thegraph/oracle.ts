import {OrmpOracleAssigned, QueryNextOracleAssigned} from "../types/graph";
import {GraphCommon} from "./_common";


export class ThegraphIndexerOracle extends GraphCommon {

  public async nextAssigned(variables: QueryNextOracleAssigned): Promise<OrmpOracleAssigned | undefined> {
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
