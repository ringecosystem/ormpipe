import { CollectionKit } from "../toolkit/collection";
import {
  QueryOrmpProtocolMessageAccepted,
  QueryMessageAcceptedListByHashes,
  QueryLastImportedMessageHash,
  QueryNextMessageAccepted,
  QueryRelayerMessageAccepted,
  QueryBasicMessageAccepted,
} from "../types/graphql";
import {
  OracleImportedMessageHash,
  OrmpMessageAccepted,
  OrmpMessageDispatched,
} from "../types/sqd";
import { GraphCommon } from "./_common";

export class SqdIndexOrmp extends GraphCommon {
  public async inspectMessageAccepted(
    variables: QueryOrmpProtocolMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    if (!variables.msgHash && variables.messageIndex == undefined)
      throw new Error("missing msghash or messageIndex");
    const query = `
    query QueryMessageAccepted(
        ${variables.msgHash ? "$msgHash: String!" : ""}
        ${variables.messageIndex != undefined ? "$messageIndex: BigInt!" : ""}
        $chainId: BigInt!
      ) {
      ormpMessageAccepteds(
        limit: 1
        orderBy: index_ASC
        where: {
          ${variables.msgHash ? "msgHash_eq: $msgHash" : ""}
          ${
            variables.messageIndex != undefined ? "index_eq: $messageIndex" : ""
          }
          fromChainId_eq: $chainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        channel
        index
        fromChainId
        from
        toChainId
        to
        gasLimit
        encoded
        logIndex

        oracle
        oracleAssigned
        oracleAssignedFee
        relayer
        relayerAssigned
        relayerAssignedFee
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpMessageAccepteds",
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
    query QueryMessageAcceptedList($msgHashes: [String!]!, $chainId: BigInt!) {
      ormpMessageAccepteds(
        orderBy: index_ASC
        where: {
          msgHash_in: $msgHashes
          fromChainId_eq: $chainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        channel
        index
        fromChainId
        from
        toChainId
        to
        gasLimit
        encoded
        logIndex

        oracle
        oracleAssigned
        oracleAssignedFee
        relayer
        relayerAssigned
        relayerAssignedFee
      }
    }
    `;

    const rets: OrmpMessageAccepted[] = [];
    for (const parts of msgHashesParts) {
      const _variables = { chainId: variables.chainId, msgHashes: parts };
      const pickedAssignedMessages: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: "ormpMessageAccepteds",
      });
      rets.push(...pickedAssignedMessages);
    }
    return rets;
  }

  public async lastImportedMessageHash(
    variables: QueryLastImportedMessageHash
  ): Promise<OracleImportedMessageHash | undefined> {
    const query = `
    query QueryLastImportedMessageHash(
      $fromChainId: BigInt!
      $toChainId: BigInt!
    ) {
      ormpHashImporteds(
        limit: 1
        orderBy: msgIndex_DESC
        where: {
          srcChainId_eq: $fromChainId
          targetChainId_eq: $toChainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        srcChainId
        targetChainId
        msgIndex
        hash
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpHashImporteds",
    });
  }

  // public async queryRelayerMessageHashes(
  //   variables: QueryMessageHashes
  // ): Promise<string[]> {
  //   const query = `
  //   query QueryMessageAcceptedHashes(
  //     $offset: Int!
  //     $messageIndex: BigInt!
  //     $chainId: BigInt!
  //   ) {
  //     ormpMessageAccepteds(
  //       limit: 50
  //       offset: $offset
  //       orderBy: index_ASC
  //       where: {
  //         fromChainId_eq: $chainId
  //         index_lte: $messageIndex
  //       }
  //     ) {
  //       index
  //       msgHash
  //     }
  //   }
  //   `;
  // }

  public async nextOracleMessageAccepted(
    variables: QueryNextMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryNextMessageAccepted(
      $messageIndex: BigInt!
      $fromChainId: BigInt!
      $toChainId: BigInt!
    ) {
      ormpMessageAccepteds(
        limit: 1
        orderBy: index_ASC
        where: {
          oracleAssigned_eq: true
          index_gt: $messageIndex
          fromChainId_eq: $fromChainId
          toChainId_eq: $toChainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        channel
        index
        fromChainId
        from
        toChainId
        to
        gasLimit
        encoded
        logIndex

        oracle
        oracleAssigned
        oracleAssignedFee
        relayer
        relayerAssigned
        relayerAssignedFee
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpMessageAccepteds",
    });
  }

  public async pickRelayerMessageAcceptedHashes(
    variables: QueryRelayerMessageAccepted
  ): Promise<string[]> {
    const query = `
    query QueryNextMessageAccepted(
      $offset: Int!
      $limit: Int!
      $messageIndex: BigInt!
      $fromChainId: BigInt!
      $toChainId: BigInt!
    ) {
      ormpMessageAccepteds(
        limit: $limit
        offset: $offset
        orderBy: index_ASC
        where: {
          index_lte: $messageIndex
          fromChainId_eq: $fromChainId
          toChainId_eq: $toChainId
        }
      ) {
        msgHash
      }
    }
    `;

    let offset = 0;
    const limit = 50;
    const rets: string[] = [];
    while (true) {
      const _variables = {
        ...variables,
        offset,
        limit,
      };
      const ormpMessageAccepteds: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: "ormpMessageAccepteds",
      });
      if (ormpMessageAccepteds.length == 0) {
        return rets;
      }

      const hashes = ormpMessageAccepteds.map((item) => item.msgHash);
      rets.push(...hashes);
      offset += limit;
    }
  }

  public async pickUnRelayedMessageHashes(
    chainId: number,
    msgHashes: string[]
  ): Promise<string[]> {
    if (!msgHashes.length) {
      return [];
    }
    const msgHashesParts: string[][] = CollectionKit.split(msgHashes, 100);
    const query = `
    query QueryLastMessageDispatched(
      $msgHashes: [String!]!
      $chainId: BigInt!
    ) {
      ormpMessageDispatcheds(
        orderBy: blockNumber_ASC,
        where: {
          msgHash_in: $msgHashes
          targetChainId_eq: $chainId
        }
      ) {
        msgHash
      }
    }
    `;
    const unRelayMessageHashes: string[] = [];
    for (const parts of msgHashesParts) {
      const variables = { chainId: chainId, msgHashes: parts };
      const unRelayMessages: OrmpMessageDispatched[] = await super.list({
        query,
        variables,
        schema: "ormpMessageDispatcheds",
      });
      const hashes = unRelayMessages.map((item) => item.msgHash);
      unRelayMessageHashes.push(...hashes);
    }
    return msgHashes.filter((item) => unRelayMessageHashes.indexOf(item) == -1);
  }

  public async pickOracleAssignedMessageHashes(
    variables: QueryBasicMessageAccepted
  ): Promise<string[]> {
    const query = `
    query QueryAllOracleAssignedMessageAccepted(
      $offset: Int!
      $limit: Int!
      $fromChainId: BigInt!
      $toChainId: BigInt!
    ) {
      ormpMessageAccepteds(
        limit: $limit
        offset: $offset
        orderBy: index_ASC
        where: {
          oracleAssigned: true
          fromChainId_eq: $fromChainId
          toChainId_eq: $toChainId
        }
      ) {
        msgHash
      }
    }
    `;

    let offset = 0;
    const limit = 50;
    const rets: string[] = [];
    while (true) {
      const _variables = {
        ...variables,
        offset,
        limit,
      };
      const ormpMessageAccepteds: OrmpMessageAccepted[] = await super.list({
        query,
        variables: _variables,
        schema: "ormpMessageAccepteds",
      });
      if (ormpMessageAccepteds.length == 0) {
        return rets;
      }

      const hashes = ormpMessageAccepteds.map((item) => item.msgHash);
      rets.push(...hashes);
      offset += limit;
    }
  }

  public async lastRelayerAssigned(
    variables: QueryBasicMessageAccepted
  ): Promise<OrmpMessageAccepted | undefined> {
    const query = `
    query QueryLastMessageAccepted(
      $fromChainId: BigInt!
      $toChainId: BigInt!
    ) {
      ormpMessageAccepteds(
        limit: 1
        orderBy: index_DESC
        where: {
          relayerAssigned: true
          fromChainId: $fromChainId
          toChainId: $toChainId
        }
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash

        msgHash
        channel
        index
        fromChainId
        from
        toChainId
        to
        gasLimit
        encoded
        logIndex

        oracle
        oracleAssigned
        oracleAssignedFee
        relayer
        relayerAssigned
        relayerAssignedFee
      }
    }
    `;
    return await super.single({
      query,
      variables,
      schema: "ormpMessageAccepteds",
    });
  }
}
