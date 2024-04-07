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
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
        orderDirection: asc
        where: {
          ${variables.msgHash ? "msgHash: $msgHash" : ""}
          ${variables.root ? "root: $root" : ""}
          ${
            variables.messageIndex != undefined
              ? "message_index: $messageIndex"
              : ""
          }
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
        message_gasLimit
        message_encoded
        logIndex

        oracleAssigned
        oracleAssignedFee
        oracleLogIndex
        relayerAssigned
        relayerAssignedFee
        relayerLogIndex
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpProtocolMessageAccepteds",
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
        message_gasLimit
        message_encoded
        logIndex

        oracleAssigned
        oracleAssignedFee
        oracleLogIndex
        relayerAssigned
        relayerAssignedFee
        relayerLogIndex
      }
    }
    `;
    const rets: OrmpMessageAccepted[] = [];
    for (const parts of msgHashesParts) {
      const _variables = { msgHashes: parts };
      const pickedAssignedMessages: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: "ormpProtocolMessageAccepteds",
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
      ormpOracleImportedMessageRoots(
        first: 1
        orderBy: blockNumber
        orderDirection: desc
        where: {
          chainId: $chainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        chainId
        blockHeight
        messageRoot
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpOracleImportedMessageRoots",
    });
  }

  public async queryRelayerMessageHashes(
    variables: QueryMessageHashes
  ): Promise<string[]> {
    const query = `
    query QueryMessageAcceptedHashes($skip: Int!, $messageIndex: BigInt!) {
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
        schema: "ormpProtocolMessageAccepteds",
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
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
        orderDirection: asc
        where: {
          oracleAssigned: true
          message_index_gt: $messageIndex
          message_toChainId: $toChainId
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
        message_gasLimit
        message_encoded
        logIndex

        oracleAssigned
        oracleAssignedFee
        oracleLogIndex
        relayerAssigned
        relayerAssignedFee
        relayerLogIndex
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpProtocolMessageAccepteds",
    });
  }

  public async pickRelayerMessageAcceptedHashes(
    variables: QueryRelayerMessageAccepted
  ): Promise<string[]> {
    const query = `
    query QueryNextMessageAccepted($skip: Int!, $messageIndex: BigInt!, $toChainId: Int!) {
      ormpProtocolMessageAccepteds(
        skip: $skip
        orderBy: message_index
        orderDirection: asc
        where: {
          relayerAssigned: true
          message_index_lte: $messageIndex
          message_toChainId: $toChainId
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
        schema: "ormpProtocolMessageAccepteds",
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
      const variables = { msgHashes: parts };
      const unRelayMessages: OrmpMessageDispatched[] = await super.list({
        query,
        variables,
        schema: "ormpProtocolMessageDispatcheds",
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
      ormpProtocolMessageAccepteds(
        skip: $skip
        first: 10
        orderBy: message_index
        orderDirection: asc
        where: {
          oracleAssigned: true
          message_toChainId: $toChainId
        }
      ) {
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
        schema: "ormpProtocolMessageAccepteds",
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
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
        orderDirection: desc
        where: {
          oracleAssigned: true
          message_toChainId: $toChainId
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
        message_gasLimit
        message_encoded
        logIndex

        oracleAssigned
        oracleAssignedFee
        oracleLogIndex
        relayerAssigned
        relayerAssignedFee
        relayerLogIndex
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpProtocolMessageAccepteds",
    });
  }

  public async lastRelayerAssigned(
    variables: QueryBasicMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryLastMessageAccepted($toChainId: Int!) {
      ormpProtocolMessageAccepteds(
        first: 1
        orderBy: message_index
        orderDirection: desc
        where: {
          relayerAssigned: true
          message_toChainId: $toChainId
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
        message_gasLimit
        message_encoded
        logIndex

        oracleAssigned
        oracleAssignedFee
        oracleLogIndex
        relayerAssigned
        relayerAssignedFee
        relayerLogIndex
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpProtocolMessageAccepteds",
    });
  }
}
