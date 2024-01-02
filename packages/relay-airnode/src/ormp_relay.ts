import {OracleRelay} from "./relay/oracle";
import {OrmpRelayConfig, OrmpRelayStartInput, StartTask} from "./types/config";
import {BaseLifecycle, OracleLifecycle, RelayerLifecycle} from "./types/lifecycle";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {RelayerRelay} from "./relay/relayer";
import {RelayDirection} from "./types/mark";
import {ThegraphIndexer} from "@darwinia/ormpipe-indexer/dist/thegraph";
import {RelayClient} from "./client";
import {setTimeout} from "timers/promises";
import {logger} from "@darwinia/ormpipe-logger";
import {RelayStorage} from "./helper/storage";

export class OrmpRelayAirnode {
  constructor(
    private readonly config: OrmpRelayConfig,
  ) {
  }

  public async start() {
    const pairs = this.config.enablePair;
    if (!pairs || !pairs.length) {
      logger.warn(
        'please add --enable-pair to your command',
        {target: 'ormpipe', breads: ['ormpipe', 'start']},
      );
      return;
    }

    const {tasks, features} = this.config;

    let times = 0;
    while (true) {
      times += 1;
      logger.info('====== start ormpipe relay round [%s] ======', times, {target: 'ormpipe'});

      for (const pair of pairs) {
        const [source, target] = pair.split('-');
        if (!source || !target) {
          continue;
        }
        logger.info('====== %s-%s ======', source, target, {target: 'ormpipe'});
        const sourceChain = this.config.chain[source];
        const targetChain = this.config.chain[target];
        if (!sourceChain.name) {
          sourceChain.name = source;
        }
        if (!targetChain.name) {
          targetChain.name = target;
        }
        for (const task of tasks) {
          try {
            await this.run({
              task, features,
              dataPath: this.config.dataPath,
              source: sourceChain,
              target: targetChain,
              signer: this.config.signer,
            });
          } catch (e: any) {
            logger.error(e, {target: 'ormpipe', breads: ['ormpipe', 'start', task]});
          } finally {
            await setTimeout(5000);
          }
        }
        await setTimeout(5000);
      }

      logger.info('====== end ormpipe relay round [%s] ====== wait 5s.', times, {target: 'ormpipe'});
    }
  }

  private async run(input: OrmpRelayStartInput) {
    const features = input.features;
    const sourceToTargetConfig: OrmpRelayStartInput = {...input};
    const targetToSourceConfig: OrmpRelayStartInput = {
      task: input.task,
      features: input.features,
      dataPath: input.dataPath,
      signer: input.signer,
      source: input.target,
      target: input.source,
    };

    switch (input.task) {
      case StartTask.oracle: {
        const sourceToTargetLifecycle = await this.initOracleLifecycle(
          sourceToTargetConfig,
          RelayDirection.SourceToTarget,
        );
        const sourceToTargetRelayer = new OracleRelay(sourceToTargetLifecycle);
        await sourceToTargetRelayer.start(features);

        const targetToSourceLifecycle = await this.initOracleLifecycle(
          targetToSourceConfig,
          RelayDirection.TargetToSource,
        );
        const targetToSourceRelayer = new OracleRelay(targetToSourceLifecycle);
        await targetToSourceRelayer.start(features);

        break;
      }
      case StartTask.relayer: {
        const sourceToTargetLifecycle = await this.initRelayerLifecycle(
          sourceToTargetConfig,
          RelayDirection.SourceToTarget,
        );
        const sourceToTargetRelayer = new RelayerRelay(sourceToTargetLifecycle);
        await sourceToTargetRelayer.start();

        const targetToSourceLifeCycle = await this.initRelayerLifecycle(
          targetToSourceConfig,
          RelayDirection.TargetToSource,
        );
        const targetToSourceRelayer = new RelayerRelay(targetToSourceLifeCycle);
        await targetToSourceRelayer.start();

        break;
      }
    }
  }

  private async initOracleLifecycle(config: OrmpRelayStartInput, direction: RelayDirection): Promise<OracleLifecycle> {
    if (!config.source.indexer) {
      throw new Error(`missing ${config.source.name} indexer endpoint`);
    }
    if (!config.target.indexer) {
      throw new Error(`missing ${config.target.name} indexer endpoint`);
    }

    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerOrmp: sourceIndexer.ormp(),
      targetIndexerOrmp: targetIndexer.ormp(),
      targetIndexerSubapi: targetIndexer.subapi(),
      targetSubapiClient: baseLifecycle.targetClient.subapi(config.target.contract.subapi),
    };
  }

  private async initRelayerLifecycle(config: OrmpRelayStartInput, direction: RelayDirection): Promise<RelayerLifecycle> {
    if (!config.source.indexer) {
      throw new Error(`missing ${config.source.name} indexer endpoint`);
    }
    if (!config.target.indexer) {
      throw new Error(`missing ${config.target.name} indexer endpoint`);
    }
    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerOrmp: sourceIndexer.ormp(),
      targetIndexerOrmp: targetIndexer.ormp(),
      targetIndexerSubapi: targetIndexer.subapi(),
      sourceRelayerClient: baseLifecycle.sourceClient.relayer(config.source.contract.relayer),
      targetRelayerClient: baseLifecycle.targetClient.relayer(config.target.contract.relayer),
    };
  }

  private async initBaseLifecycle(config: OrmpRelayStartInput, direction: RelayDirection): Promise<BaseLifecycle> {
    const sourceClient = new RelayClient({
      chainName: config.source.name,
      endpoint: config.source.endpoint,
      signer: config.signer,
      signerSubapi: config.signer,
      signerRelayer: config.signer,
    });
    const targetClient = new RelayClient({
      chainName: config.target.name,
      endpoint: config.target.endpoint,
      signer: config.signer,
      signerSubapi: config.signer,
      signerRelayer: config.signer,
    });
    const storage = new RelayStorage(config.dataPath, {
      keyPrefix: `${config.source.name}-${config.target.name}`,
    });
    return {
      storage,
      direction,
      sourceName: config.source.name,
      targetName: config.target.name,
      sourceClient,
      targetClient,
    };
  }

  private initSourceIndexer(config: OrmpRelayStartInput): ThegraphIndexer {
    return new OrmpipeIndexer({
      endpoint: config.source.indexer,
      ormpEndpoint: config.source.indexer,
      subapiEndpoint: config.source.indexer,
    }).thegraph();
  }

  private initTargetIndexer(config: OrmpRelayStartInput): ThegraphIndexer {
    return new OrmpipeIndexer({
      endpoint: config.target.indexer,
      ormpEndpoint: config.target.indexer,
      subapiEndpoint: config.target.indexer,
    }).thegraph();
  }
}
