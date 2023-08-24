import {RelayerLifecycle} from "../types/lifecycle";
import {CommonRelay} from "./_common";
import {ThegraphIndexOrmp, ThegraphIndexerAirnode, ThegraphIndexerRelayer} from "@darwinia/ormpipe-indexer";
import {RelayerContractClient} from "../client/contract_relayer";
import {logger} from "@darwinia/ormpipe-logger";

interface JobInput {
  relayStart: number
}

export class RelayerRelay extends CommonRelay<RelayerLifecycle> {

  constructor(lifecycle: RelayerLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerRelayer(): ThegraphIndexerRelayer {
    return super.lifecycle.sourceIndexerRelayer
  }

  public get sourceIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp
  }

  public get targetIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.targetIndexerOrmp
  }

  public get targetIndexerAirnode(): ThegraphIndexerAirnode {
    return super.lifecycle.targetIndexerAirnode
  }

  public get targetRelayerClient(): RelayerContractClient {
    return super.lifecycle.targetRelayerClient
  }

  public async start() {
    try {
      const input = await this.prepare();
      await this.run(input);
    } catch (e: any) {
      logger.error(e, super.meta('relayer'));
    }
  }

  private async prepare(): Promise<JobInput> {
    // delivery start block
    logger.debug(
      `query last message dispatched from ${super.targetName} indexer-channel contract`,
      super.meta('oracle', ['delivery'])
    );
    const targetLastMessageDispatched = await this.targetIndexerOrmp.lastMessageDispatched();
    // todo: check running block
    const queryNextMessageStartBlockNumber = +(targetLastMessageDispatched?.blockNumber ?? 0);
    logger.debug(
      `queried next oracle from block number %s(%s)`,
      queryNextMessageStartBlockNumber,
      super.sourceName,
      super.meta('oracle', ['delivery'])
    );

    // aggregate start block

    // return
    return {
      relayStart: queryNextMessageStartBlockNumber,
    } as JobInput;
  }

  private async run(input: JobInput) {
    logger.debug('start relayer relay', super.meta('relayer', ['relay']));

  }

}
