import {OrmpOracleAssigned, QueryNextOracleAssigned} from "../types/graph";
import {GraphCommon} from "./_common";


export class ThegraphIndexerOracle extends GraphCommon {

  public async nextAssigned(variables: QueryNextOracleAssigned): Promise<OrmpOracleAssigned | undefined> {
    const query = `
    query NextOracleAssigned($blockNumber: BigInt!) {
      ormpOracleAssigneds(
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
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpOracleAssigneds'})
  }

}
