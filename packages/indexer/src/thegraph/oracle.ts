import {IndexerInput} from "../types/indexer";
import {QueryNextOracleAssigned} from "../types/graph";
import {Gqlc} from "../gqlc";
import {logger} from "@darwinia/ormpipe-logger";


export class GraphOracle {
  private readonly input: IndexerInput;
  private readonly gqlc: Gqlc;

  constructor(input: IndexerInput, gqlc: Gqlc) {
    this.input = input;
    this.gqlc = gqlc;
  }

  public async nextAssigned(options: QueryNextOracleAssigned): Promise<void> {
    const graphql = `
    query NextOracleAssigned($blockNumber: BigInt!) {
      ormpOracleAssigneds(
        first: 5
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
    const data = await this.gqlc.query({query: graphql, variables: options});
    logger.info(data);
  }

}
