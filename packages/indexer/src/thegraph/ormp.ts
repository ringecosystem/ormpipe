import {
  OrmpMessageAccepted,
  OrmpMessageDispatched,
  QueryChannelMessageAccepted,
  QueryInspectMessageDispatched, QueryMessageAcceptedListByHashes,
  QueryMessageHashes,
  QueryNextMessageAccepted,
  QueryOtherThanDispatchedList,
  QueryPreparedMessages
} from "../types/graph";
import {GraphCommon} from "./_common";

export class ThegraphIndexOrmp extends GraphCommon {

  public async inspectMessageAccepted(variables: QueryChannelMessageAccepted): Promise<OrmpMessageAccepted | undefined> {
    if (!variables.msgHash && !variables.root)
      throw new Error('missing msghash or root');
    const query = `
    query QueryMessageAccepted(
      ${variables.msgHash ? '$msgHash: Bytes!' : ''}
      ${variables.root ? '$root: Bytes!' : ''}
    ) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
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

  public async queryMessageAcceptedListByHashes(variables: QueryMessageAcceptedListByHashes): Promise<OrmpMessageAccepted[]> {
    const query = `
    query QueryMessageAcceptedList($msgHashes: [String!]!) {
      ormpProtocolMessageAccepteds(
        orderBy: message_index
        orderDirection: asc
        where: {
          msgHash_in: $msgHashes
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
    return await super.list({query, variables, schema: 'ormpProtocolMessageAccepteds'});
  }

  public async messageHashes(variables: QueryMessageHashes): Promise<string[]> {
    const query = `
    query QueryMessageAcceptedHashes($messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        orderBy: message_index
        orderDirection: asc
        where: {
          message_index_lte: $messageIndex
        }
      ) {
        message_index
        msgHash
      }
    }
    `;
    const resp: OrmpMessageAccepted[] = await super.list({
      query,
      variables,
      schema: 'ormpProtocolMessageAccepteds',
    });
    return resp.map(item => item.msgHash)
  }

  public async otherThanDispatchedList(variables: QueryOtherThanDispatchedList): Promise<OrmpMessageDispatched[]> {
    const query = `
    query QueryRelayedMessageDispatched($msgHashes: [String!]!) {
      ormpProtocolMessageDispatcheds(
        where: {
          msgHash_not_in: $msgHashes
        }
      ) {
        msgHash
      }
    }
    `;
    return await super.list({
      query,
      variables,
      schema: 'ormpProtocolMessageDispatcheds'
    });
  }

  public async nextMessageAccepted(variables: QueryNextMessageAccepted): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted($messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
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

  public async inspectMessageDispatched(variables: QueryInspectMessageDispatched): Promise<OrmpMessageDispatched | undefined> {
    const query = `
    query QueryLastMessageDispatched($msgHash: String!) {
      ormpProtocolMessageDispatcheds(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
        where: {
          msgHash: $msgHash
        }
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
    return await super.single({query, variables, schema: 'ormpProtocolMessageDispatcheds'});
  }

  public async queryPreparedMessageAcceptedHashes(variables: QueryPreparedMessages): Promise<string[]> {
    const query = `
    query QueryNextMessageAccepted($messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        orderBy: message_index
        orderDirection: asc
        where: {
          message_index_lte: $messageIndex
        }
      ) {
        msgHash
      }
    }
    `;
    const preparedMessageAcceptedHashes: OrmpMessageAccepted[] = await super.list({
      query,
      variables,
      schema: 'ormpProtocolMessageAccepteds',
    });
    return preparedMessageAcceptedHashes.map(item => item.msgHash);
  }

  public async pickUnRelayedMessageHashes(msgHashes: string[]): Promise<string[]> {
    if (!msgHashes.length) {
      return [];
    }
    const query = `
    query QueryLastMessageDispatched($msgHashes: [String!]!) {
      ormpProtocolMessageDispatcheds(
        orderBy: blockNumber
        orderDirection: asc
        where: {
          msgHash_in: $msgHashes
        }
      ) {
        msgHash
      }
    }
    `;
    const variables = {msgHashes};
    const unRelayMessages: OrmpMessageDispatched[] = await super.list({
      query,
      variables,
      schema: 'ormpProtocolMessageDispatcheds',
    });
    const unRelayMessageHashes = unRelayMessages.map(item => item.msgHash);
    return msgHashes.filter(item => unRelayMessageHashes.indexOf(item) == -1);
  }

}
