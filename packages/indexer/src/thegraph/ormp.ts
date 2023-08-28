import {
  OrmpChannelMessageAccepted,
  OrmpChannelMessageDispatched,
  QueryChannelMessageAccepted,
  QueryNextChannelMessagAccepted
} from "../types/graph";
import {GraphCommon} from "./_common";

export class ThegraphIndexOrmp extends GraphCommon {

  public async inspectMessageAccepted(variables: QueryChannelMessageAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const query = `
    query QueryMessageAccepted($msgHash: Bytes!) {
      ormpProtocolMessageAccepteds(
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
    return await super.single({query, variables, schema: 'ormpProtocolMessageAccepteds'});
  }

  public async nextMessageAccepted(variables: QueryNextChannelMessagAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted($blockNumber: BigInt!) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          blockNumber_gt: $blockNumber
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
    return await super.single({query, variables, schema: 'ormpProtocolMessageAccepteds'});
  }

  public async lastMessageDispatched(): Promise<OrmpChannelMessageDispatched | undefined> {
    const query = `
    query QueryLastMessageDispatched {
      ormpProtocolMessageDispatcheds(
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
    return await super.single({query, schema: 'ormpProtocolMessageDispatcheds'});
  }

}
