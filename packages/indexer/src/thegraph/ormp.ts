import {
  OrmpChannelMessageDispatched,
  OrmpMessageAccepted,
  QueryChannelMessageAccepted,
  QueryNextMessageAccepted,
  QueryNextUndoMessageAccepted
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

  public async messageHashes(): Promise<string[]> {
    const query = `
    query QueryMessageAcceptedHashes {
      ormpProtocolMessageAccepteds(
        orderBy: message_index
        orderDirection: asc
      ) {
        message_index
        msgHash
      }
    }
    `;
    const resp: OrmpMessageAccepted[] = await super.list({
      query,
      schema: 'ormpProtocolMessageAccepteds',
    });
    return resp.map(item => item.msgHash)
  }

  public async nextUndoMessageAccepted(variables: QueryNextUndoMessageAccepted): Promise<OrmpMessageAccepted | undefined> {
    if (!variables.msgHashes.length) {
      return this.nextMessageAccepted({messageIndex: -1});
    }
    const query = `
    query QueryNextMessageAccepted($msgHashes: [String!]!) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
        orderDirection: asc
        where: {
          msgHash_not_in: $msgHashes
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

  public async lastMessageAccepted(): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
        orderDirection: desc
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
    return await super.single({query, schema: 'ormpProtocolMessageAccepteds'});
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
