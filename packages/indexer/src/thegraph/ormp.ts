import {
  OrmpMessageDispatched,
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
    query QueryRelayedMessageDispatched($msgHashes: [String!]!) {
      ormpProtocolMessageDispatcheds(
        where: {
          msgHash_in: $msgHashes
        }
      ) {
        msgHash
      }
    }
    `;
    const relayedDispatcheds: OrmpMessageDispatched[] = await super.list({query, variables, schema: 'ormpProtocolMessageDispatcheds'});
    const relayedHashes = relayedDispatcheds.map(item => item.msgHash);
    const unrelayeds = [...variables.msgHashes]
      .filter(item => !relayedHashes.includes(item));
    if (!unrelayeds.length) {
      return;
    }

    const unRelayedMessageHash = unrelayeds[0];
    return await this.inspectMessageAccepted({msgHash: unRelayedMessageHash});
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

  public async lastMessageDispatched(): Promise<OrmpMessageDispatched | undefined> {
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
