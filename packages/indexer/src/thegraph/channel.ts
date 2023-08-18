import {IndexerInput} from "../types/indexer";
import {Gqlc} from "../gqlc";
import {IGraphResponse, OrmpChannelMessageAccepted, QueryNextChannelMessagAccepted} from "../types/graph";

export class GraphChannel {
  private readonly input: IndexerInput;
  private readonly gqlc: Gqlc;

  constructor(input: IndexerInput, gqlc: Gqlc) {
    this.input = input;
    this.gqlc = gqlc;
  }


  public async nextMessageAccepted(options: QueryNextChannelMessagAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const graphql = `
    query NextMessageAccepted {
      messageAccepteds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          blockNumber_gt: 0
        }
      ) {
        id

        msgHash
        root
        message_channel
        message_index
        message_fromChainId
        message_from
        message_toChainId
        message_to
        message_encoded
​
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    const resp: IGraphResponse<Record<string, OrmpChannelMessageAccepted[]>> = await this.gqlc.query({
      query: graphql,
      variables: options
    });
    const {data} = resp;
    const assigneds = data['ormpOracleAssigneds'];
    return assigneds ? assigneds[0] : undefined;
  }

}
