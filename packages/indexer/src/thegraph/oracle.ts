import {IndexerInput} from "../types/indexer";
import {IGraphResponse, OrmpOracleAssigned, QueryNextOracleAssigned} from "../types/graph";
import {Gqlc} from "../gqlc";
import {logger} from "@darwinia/ormpipe-logger";


export class GraphOracle {
  private readonly input: IndexerInput;
  private readonly gqlc: Gqlc;

  constructor(input: IndexerInput, gqlc: Gqlc) {
    this.input = input;
    this.gqlc = gqlc;
  }

  public async nextAssigned(options: QueryNextOracleAssigned): Promise<OrmpOracleAssigned | undefined> {
    const graphql = `
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
    const resp: IGraphResponse<Record<string, OrmpOracleAssigned[]>> = await this.gqlc.query({query: graphql, variables: options});
    const {data} = resp;
    const assigneds = data['ormpOracleAssigneds'];
    return assigneds ? assigneds[0] : undefined;
  }

}
