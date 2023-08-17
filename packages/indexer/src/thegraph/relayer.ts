import {IndexerInput} from "../types/indexer";
import {Gqlc} from "../gqlc";
import {IGraphResponse, OrmpRelayerAssigned, QueryNextRelayerAssigned} from "../types/graph";

export class GraphRelayer {
  private readonly input: IndexerInput;
  private readonly gqlc: Gqlc;

  constructor(input: IndexerInput, gqlc: Gqlc) {
    this.input = input;
    this.gqlc = gqlc;
  }

  public async nextAssigned(options: QueryNextRelayerAssigned): Promise<OrmpRelayerAssigned | undefined> {
    const graphql = `
    query NextRelayerAssigned($blockNumber: BigInt!) {
      ormpRelayerAssigneds(
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
        parmas
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    const resp: IGraphResponse<Record<string, OrmpRelayerAssigned[]>> = await this.gqlc.query({query: graphql, variables: options});
    const {data} = resp;
    const assigneds = data['ormpRelayerAssigneds'];
    return assigneds ? assigneds[0] : undefined;
  }

}
