import {
  OrmpChannelMessageAccepted,
  OrmpChannelMessageDispatched,
  QueryChannelMessageAccepted, QueryMessageHashes,
  QueryNextChannelMessageAccepted
} from "../types/graph";
import {GraphCommon} from "./_common";

export class ThegraphIndexOrmp extends GraphCommon {

  public async inspectMessageAccepted(variables: QueryChannelMessageAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    if (!variables.msgHash && !variables.root)
      throw new Error('missing msghash or root');
    const query = `
    query QueryMessageAccepted(
      ${variables.msgHash ? '$msgHash: Bytes!' : ''}
      ${variables.root ? '$root: Bytes!' : ''}
    ) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          ${variables.msgHash ? 'msgHash: $msgHash' : ''}
          ${variables.root ? 'root: $root' : ''}
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

  public async messageHashes(variables: QueryMessageHashes): Promise<string[]> {
    const query = `
    query QueryMessageAcceptedHashes($messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        orderBy: message_index
        orderDirection: asc
        where: {
          message_index_lt: $messageIndex
        }
      ) {
        msgHash
      }
    }
    `;
    const resp: OrmpChannelMessageAccepted[] = await super.list({
      query,
      variables,
      schema: 'ormpProtocolMessageAccepteds',
    });
    return resp.map(item => item.msgHash)
  }

  public async nextMessageAccepted(variables: QueryNextChannelMessageAccepted): Promise<OrmpChannelMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted($messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: blockNumber
        orderDirection: asc
        where: {
          message_index_gt: $messageIndex
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
