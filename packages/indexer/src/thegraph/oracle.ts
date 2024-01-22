import {GraphCommon} from "./_common";
import {OracleImportedMessageRoot, QueryLastImportedMessageRoot} from "../types";


export class ThegraphIndexOracle extends GraphCommon {


  public async lastImportedMessageRoot(variables: QueryLastImportedMessageRoot): Promise<OracleImportedMessageRoot | undefined> {
    const query = `
    query QueryLastImportedMessageRoot($chainId: BigInt!) {
      ormpOracleImportedMessageRoots(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
        where: {
          chainId: $chainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        chainId
        messageRoot
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpOracleImportedMessageRoots'})
  }

}
