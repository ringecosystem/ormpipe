import {
  OrmpMessageAccepted,
  OrmpMessageDispatched,
  QueryBasicMessageAccepted,
  QueryMessageAcceptedListByHashes,
  QueryMessageHashes,
  QueryNextMessageAccepted,
  QueryOrmpProtocolMessageAccepted,
  QueryRelayerMessageAccepted,
  OracleImportedMessageRoot,
  QueryLastImportedMessageRoot,
} from "../types/ponder";
import { GraphCommon } from "./_common";
import { CollectionKit } from "../toolkit/collection";

export class PonderIndexOrmp extends GraphCommon {
  public async inspectMessageAccepted(
    variables: QueryOrmpProtocolMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    if (
      !variables.msgHash &&
      !variables.root &&
      variables.messageIndex == undefined
    )
      throw new Error("missing msghash or root or messageIndex");
    const query = `
    query QueryMessageAccepted(
      ${variables.msgHash ? "$msgHash: Bytes!" : ""}
      ${variables.root ? "$root: Bytes!" : ""}
      ${variables.messageIndex != undefined ? "$messageIndex: BigInt!" : ""}
    ) {
      messageAcceptedV2s(
        limit: 1
        orderBy: "messageIndex"
        orderDirection: "asc"
        where: {
          ${variables.msgHash ? "msgHash: $msgHash" : ""}
          ${variables.root ? "root: $root" : ""}
          ${
            variables.messageIndex != undefined
              ? "messageIndex: $messageIndex"
              : ""
          }
        }
      ) {
        items {
          id
          blockNumber
          blockTimestamp
          transactionHash

          msgHash
          root
          messageChannel
          messageIndex
          messageFromChainId
          messageFrom
          messageToChainId
          messageTo
          messageGasLimit
          messageEncoded
          logIndex

          oracleAssigned
          oracleAssignedFee
          oracleLogIndex
          relayerAssigned
          relayerAssignedFee
          relayerLogIndex
        }
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "messageAcceptedV2s",
    });
  }

  public async queryMessageAcceptedListByHashes(
    variables: QueryMessageAcceptedListByHashes
  ): Promise<OrmpMessageAccepted[]> {
    const msgHashesParts: string[][] = CollectionKit.split(
      variables.msgHashes,
      100
    );
    const query = `
    query QueryMessageAcceptedList($msgHashes: [String!]!) {
      messageAcceptedV2s(
        orderBy: "messageIndex"
        orderDirection: "asc"
        where: {
          msgHash_in: $msgHashes
        }
      ) {
        items {
          id
          blockNumber
          blockTimestamp
          transactionHash

          msgHash
          root
          messageChannel
          messageIndex
          messageFromChainId
          messageFrom
          messageToChainId
          messageTo
          messageGasLimit
          messageEncoded
          logIndex

          oracleAssigned
          oracleAssignedFee
          oracleLogIndex
          relayerAssigned
          relayerAssignedFee
          relayerLogIndex
        }
      }
    }
    `;
    const rets: OrmpMessageAccepted[] = [];
    for (const parts of msgHashesParts) {
      const _variables = { msgHashes: parts };
      const pickedAssignedMessages: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: "messageAcceptedV2s",
      });
      rets.push(...pickedAssignedMessages);
    }
    return rets;
  }

  public async lastImportedMessageRoot(
    variables: QueryLastImportedMessageRoot
  ): Promise<OracleImportedMessageRoot | undefined> {
    const query = `
    query QueryLastImportedMessageRoot($chainId: BigInt!) {
      hashImportedV2s(
        limit: 1
        orderBy: "blockNumber"
        orderDirection: "desc"
        where: {
          srcChainId: $chainId
        }
      ) {
        items {
          id
          blockNumber
          blockTimestamp
          transactionHash
  
          srcChainId
          lookupKey
          srcBlockNumber
          hash
        }
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "hashImportedV2s",
    });
  }

  public async queryRelayerMessageHashes(
    variables: QueryMessageHashes
  ): Promise<string[]> {
    const query = `
    query QueryMessageAcceptedHashes($skip: Int!, $messageIndex: BigInt!) {
      messageAcceptedV2s(
        skip: $skip
        orderBy: "messageIndex"
        orderDirection: "asc"
        where: {
          messageIndex_lte: $messageIndex
        }
      ) {
        items {
          messageIndex
          msgHash
        }
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
        schema: "messageAcceptedV2s",
      });
      const length = parts.length;
      if (length == 0) {
        return rets;
      }
      const hashes = parts.map((item) => item.msgHash);
      rets.push(...hashes);
      skip += length;
    }
  }

  public async nextOracleMessageAccepted(
    variables: QueryNextMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted($messageIndex: BigInt!, $toChainId: Int!) {
      messageAcceptedV2s(
        limit: 1
        orderBy: "messageIndex"
        orderDirection: "asc"
        where: {
          oracleAssigned: true
          messageIndex_gt: $messageIndex
          messageToChainId: $toChainId
        }
      ) {
        items {
          id
          blockNumber
          blockTimestamp
          transactionHash

          msgHash
          root
          messageChannel
          messageIndex
          messageFromChainId
          messageFrom
          messageToChainId
          messageTo
          messageGasLimit
          messageEncoded
          logIndex

          oracleAssigned
          oracleAssignedFee
          oracleLogIndex
          relayerAssigned
          relayerAssignedFee
          relayerLogIndex
        }
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "messageAcceptedV2s",
    });
  }

  public async pickRelayerMessageAcceptedHashes(
    variables: QueryRelayerMessageAccepted
  ): Promise<string[]> {
    const query = `
    query QueryNextMessageAccepted($skip: Int!, $messageIndex: BigInt!, $toChainId: Int!) {
      messageAcceptedV2s(
        skip: $skip
        orderBy: "messageIndex"
        orderDirection: "asc"
        where: {
          relayerAssigned: true
          messageIndex_lte: $messageIndex
          messageToChainId: $toChainId
        }
      ) {
        items {
          msgHash
        }
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
        schema: "messageAcceptedV2s",
      });
      const length = parts.length;
      if (length == 0) {
        return rets;
      }
      const hashes = parts.map((item) => item.msgHash);
      rets.push(...hashes);
      skip += length;
    }
  }

  public async pickUnRelayedMessageHashes(
    msgHashes: string[]
  ): Promise<string[]> {
    if (!msgHashes.length) {
      return [];
    }
    const msgHashesParts: string[][] = CollectionKit.split(msgHashes, 100);
    const query = `
    query QueryLastMessageDispatched($msgHashes: [String!]!) {
      messageDispatchedV2s(
        orderBy: "blockNumber"
        orderDirection: "asc"
        where: {
          msgHash_in: $msgHashes
        }
      ) {
        items {
          msgHash
        }
      }
    }
    `;
    const unRelayMessageHashes: string[] = [];
    for (const parts of msgHashesParts) {
      const variables = { msgHashes: parts };
      const unRelayMessages: OrmpMessageDispatched[] = await super.list({
        query,
        variables,
        schema: "messageDispatchedV2s",
      });
      const hashes = unRelayMessages.map((item) => item.msgHash);
      unRelayMessageHashes.push(...hashes);
    }
    // console.log(JSON.stringify(msgHashes));
    // console.log(JSON.stringify(unRelayMessageHashes));
    return msgHashes.filter((item) => unRelayMessageHashes.indexOf(item) == -1);
  }

  public async pickOracleAssignedMessageHashes(
    variables: QueryBasicMessageAccepted
  ): Promise<string[]> {
    const query = `
    query QueryAllOracleAssignedMessageAccepted($skip: Int!, $toChainId: BigInt!) {
      messageAcceptedV2s(
        skip: $skip
        limit: 10
        orderBy: "messageIndex"
        orderDirection: "asc"
        where: {
          oracleAssigned: true
          messageToChainId: $toChainId
        }
      ) {
        items {
          msgHash
        }
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
        schema: "messageAcceptedV2s",
      });
      const length = parts.length;
      if (length == 0) {
        return rets;
      }
      const hashes = parts.map((item) => item.msgHash);
      rets.push(...hashes);
      skip += length;
    }
  }

  public async lastOracleAssigned(
    variables: QueryBasicMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryLastMessageAccepted($toChainId: Int!) {
      messageAcceptedV2s(
        limit: 1
        orderBy: "messageIndex"
        orderDirection: "desc"
        where: {
          oracleAssigned: true
          messageToChainId: $toChainId
        }
      ) {
        items {
          id
          blockNumber
          blockTimestamp
          transactionHash

          msgHash
          root
          messageChannel
          messageIndex
          messageFromChainId
          messageFrom
          messageToChainId
          messageTo
          messageGasLimit
          messageEncoded
          logIndex

          oracleAssigned
          oracleAssignedFee
          oracleLogIndex
          relayerAssigned
          relayerAssignedFee
          relayerLogIndex
        }
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "messageAcceptedV2s",
    });
  }

  public async lastRelayerAssigned(
    variables: QueryBasicMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryLastMessageAccepted($toChainId: Int!) {
      messageAcceptedV2s(
        limit: 1
        orderBy: "messageIndex"
        orderDirection: "desc"
        where: {
          relayerAssigned: true
          messageToChainId: $toChainId
        }
      ) {
        items {
          id
          blockNumber
          blockTimestamp
          transactionHash

          msgHash
          root
          messageChannel
          messageIndex
          messageFromChainId
          messageFrom
          messageToChainId
          messageTo
          messageGasLimit
          messageEncoded
          logIndex

          oracleAssigned
          oracleAssignedFee
          oracleLogIndex
          relayerAssigned
          relayerAssignedFee
          relayerLogIndex
        }
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "messageAcceptedV2s",
    });
  }
}
