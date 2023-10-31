import {
  OrmpRelayerAssigned,
  QueryNextRelayerAssigned,
} from "../types/graph";
import {GraphCommon} from "./_common";
import {CollectionKit} from "../toolkit/collection";

export class ThegraphIndexerRelayer extends GraphCommon {

  public async allAssignedList(): Promise<OrmpRelayerAssigned[]> {
    const query = `
    query QueryRelayerAssignedList($skip: BigInt!) {
      ormpRelayerAssigneds(
        skip: $skip
        orderBy: seq
        orderDirection: asc
      ) {
        id
        msgHash
        fee
        params
        blockNumber
        blockTimestamp
        transactionHash
        seq
      }
    }
    `;
    const assignedList: OrmpRelayerAssigned[] = [];
    let skip = 0;
    while (true) {
      const variables = {skip};
      const parts: OrmpRelayerAssigned[] = await super.list({query, variables, schema: 'ormpRelayerAssigneds'});
      const length = parts.length;
      if (length == 0) {
        return assignedList;
      }
      assignedList.push(...parts);
      skip += length;
    }
  }

  public async lastAssignedMessage(): Promise<OrmpRelayerAssigned | undefined> {
    const query = `
    query QueryRelayerAssignedList {
      ormpRelayerAssigneds(
        first: 1
        orderBy: seq
        orderDirection: desc
      ) {
        id
        msgHash
        fee
        params
        blockNumber
        blockTimestamp
        transactionHash
        seq
      }
    }
    `;
    return await super.single({query, schema: 'ormpRelayerAssigneds'});
  }

  public async inspectAssigned(variables: QueryNextRelayerAssigned): Promise<OrmpRelayerAssigned | undefined> {
    const query = `
    query QueryRelayerAssigned($msgHash: Bytes!) {
      ormpRelayerAssigneds(
        first: 1
        orderBy: seq
        orderDirection: asc
        where: {
          msgHash: $msgHash
        }
      ) {
        id
        msgHash
        fee
        params
        blockNumber
        blockTimestamp
        transactionHash
        seq
      }
    }
    `;
    return await super.single({query, variables, schema: 'ormpRelayerAssigneds'});
  }

  public async pickAssignedMessageHashes(msgHashes: string[]): Promise<string[]> {
    if (!msgHashes.length) {
      return [];
    }

    const msgHashesParts: string[][] = CollectionKit.split(msgHashes, 100);
    const query = `
    query QueryRelayerAssigned($msgHashes: [String!]!) {
      ormpRelayerAssigneds(
        orderBy: seq
        orderDirection: asc
        where: {
          msgHash_in: $msgHashes
        }
      ) {
        msgHash
      }
    }
    `;
    const rets: string[] = [];
    for (const parts of msgHashesParts) {
      const variables = {msgHashes: parts};
      const pickedAssignedMessages: OrmpRelayerAssigned[] = await super.list({
        query,
        variables,
        schema: 'ormpRelayerAssigneds',
      });
      const pamhashes: string[] = pickedAssignedMessages.map(item => item.msgHash);
      rets.push(...pamhashes);
    }
    return rets;
  }

}
