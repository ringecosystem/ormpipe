import {
  OrmpChannelMessageAccepted,
  OrmpChannelMessageDispatched,
  QueryChannelMessageAccepted,
  QueryNextChannelMessagAccepted
} from "../types/graph";
import {GraphCommon} from "./_common";

export class ThegraphIndexChannel extends GraphCommon {

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
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        root
        message_channel
        message_index
        message_fromChainId
        message_from
        message_toChainId
        message_to
        message_encoded
      }
    }
    `;
    return await super.single({query, variables, schema: 'messageAccepteds'});
  }

  public async nextMessageAccepted(variables: QueryNextChannelMessagAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted {
      messageAccepteds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          blockNumber_gt: 0
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        root
        message_channel
        message_index
        message_fromChainId
        message_from
        message_toChainId
        message_to
        message_encoded
      }
    }
    `;
    return await super.single({query, variables, schema: 'messageAccepteds'});
  }

  public async lastMessageDispatched(): Promise<OrmpChannelMessageDispatched | undefined> {
    const query = `
    query QueryLastMessageDispatched {
      messageDispatcheds(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        dispatchResult
      }
    }
    `;
    return await super.single({query, variables: {}, schema: 'messageDispatcheds'});
  }

}
