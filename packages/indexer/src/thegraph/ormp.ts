import {
  OrmpMessageAccepted,
  OrmpMessageDispatched,
  QueryChannelMessageAccepted,
  QueryInspectMessageDispatched,
  QueryMessageAcceptedListByHashes,
  QueryMessageHashes,
  QueryNextMessageAccepted,
  QueryPreparedMessages
} from "../types/graph";
import {GraphCommon} from "./_common";
import {CollectionKit} from "../toolkit/collection";

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
    const msgHashesParts: string[][] = CollectionKit.split(variables.msgHashes, 100);
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
    const rets: OrmpMessageAccepted[] = [];
    for (const parts of msgHashesParts) {
      const _variables = {msgHashes: parts};
      const pickedAssignedMessages: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: 'ormpProtocolMessageAccepteds',
      });
      rets.push(...pickedAssignedMessages);
    }
    return rets;
  }

  public async messageHashes(variables: QueryMessageHashes): Promise<string[]> {
    const query = `
    query QueryMessageAcceptedHashes($skip: BigInt!, $messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        skip: $skip
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
    let skip = 0;
    const rets: string[] = [];
    while (true) {
      const _variables = {
        ...variables,
        skip,
      };
      const parts: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: 'ormpProtocolMessageAccepteds',
      });
      const length = parts.length;
      if (length == 0) {
        return rets;
      }
      const hashes = parts.map(item => item.msgHash);
      rets.push(...hashes);
      skip += length;
    }
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
    query QueryNextMessageAccepted($skip: BigInt!, $messageIndex: BigInt!) {
      ormpProtocolMessageAccepteds(
        skip: $skip
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

    const rets: string[] = [];
    let skip = 0;
    while (true) {
      const _variable = {
        ...variables,
        skip,
      };
      const parts: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variable,
        schema: 'ormpProtocolMessageAccepteds',
      });
      const length = parts.length;
      if (length == 0) {
        return rets;
      }
      const hashes = parts.map(item => item.msgHash);
      rets.push(...hashes);
    }
  }

  public async pickUnRelayedMessageHashes(msgHashes: string[]): Promise<string[]> {
    if (!msgHashes.length) {
      return [];
    }
    const msgHashesParts: string[][] = CollectionKit.split(msgHashes, 100);
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
    const unRelayMessageHashes: string[] = [];
    for (const parts of msgHashesParts) {
      const variables = {msgHashes: parts};
      const unRelayMessages: OrmpMessageDispatched[] = await super.list({
        query,
        variables,
        schema: 'ormpProtocolMessageDispatcheds',
      });
      const hashes = unRelayMessages.map(item => item.msgHash);
      unRelayMessageHashes.push(...hashes);
    }
    return msgHashes.filter(item => unRelayMessageHashes.indexOf(item) == -1);
  }

}
