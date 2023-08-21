import {OrmpChannelMessageAccepted, QueryChannelMessageAccepted, QueryNextChannelMessagAccepted} from "../types/graph";
import {GraphCommon} from "./_common";

export class GraphChannel extends GraphCommon {

  public async inspectMessageAccepted(variables: QueryChannelMessageAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const query = `
    query QueryMessageAccepted($msgHash: Bytes!) {
      messageAccepteds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          msgHash: $msgHash
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
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.single({query, variables, schema: 'messageAccepteds'});
  }

  public async nextMessageAccepted(variables: QueryNextChannelMessagAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const query = `
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
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
    `;
    return await super.single({query, variables, schema: 'messageAccepteds'});
  }

}
