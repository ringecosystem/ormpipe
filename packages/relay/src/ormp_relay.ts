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

export class OrmpRelay {
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

    switch (input.task) {
      case StartTask.oracle: {
        const sourceToTargetLifecycle = await this.initOracleLifecycle(
          input,
          RelayDirection.SourceToTarget,
        );
        const sourceToTargetRelayer = new OracleRelay(sourceToTargetLifecycle);
        await sourceToTargetRelayer.start(features);

        const targetToSourceLifecycle = await this.initOracleLifecycle(
          input,
          RelayDirection.TargetToSource,
        );
        const targetToSourceRelayer = new OracleRelay(targetToSourceLifecycle);
        await targetToSourceRelayer.start(features);

        break;
      }
      case StartTask.relayer: {
        const sourceToTargetLifecycle = await this.initRelayerLifecycle(
          input,
          RelayDirection.TargetToSource,
        );
        const sourceToTargetRelayer = new RelayerRelay(sourceToTargetLifecycle);
        await sourceToTargetRelayer.start();

        const targetToSourceLifeCycle = await this.initRelayerLifecycle(
          input,
          RelayDirection.TargetToSource,
        );
        const targetToSourceRelayer = new RelayerRelay(targetToSourceLifeCycle);
        await targetToSourceRelayer.start();

        break;
      }
    }
  }

  // private async run(input: OrmpRelayStartInput) {
  //
  //   const pairs = this.config.enablePair;
  //   // // source -> target
  //   // const sourceToTargetConfig: RelayConfig = {...this.config};
  //   // // target -> source
  //   // const targetToSourceConfig: RelayConfig = {
  // //     ...this.config,
  // //     sourceName: this.config.targetName,
  // //     sourceEndpoint: this.config.targetEndpoint,
  // //     targetName: this.config.sourceName,
  // //     targetEndpoint: this.config.sourceEndpoint,
  // //     sourceIndexerEndpoint: this.config.targetIndexerEndpoint,
  // //     sourceIndexerOracleEndpoint: this.config.targetIndexerOracleEndpoint,
  // //     sourceIndexerRelayerEndpoint: this.config.targetIndexerRelayerEndpoint,
  // //     sourceIndexerOrmpEndpoint: this.config.targetIndexerOrmpEndpoint,
  // //     sourceIndexerSubapiEndpoint: this.config.targetIndexerSubapiEndpoint,
  // //     targetIndexerEndpoint: this.config.sourceIndexerEndpoint,
  // //     targetIndexerOracleEndpoint: this.config.sourceIndexerOracleEndpoint,
  // //     targetIndexerRelayerEndpoint: this.config.sourceIndexerRelayerEndpoint,
  // //     targetIndexerOrmpEndpoint: this.config.sourceIndexerOrmpEndpoint,
  // //     targetIndexerSubapiEndpoint: this.config.sourceIndexerSubapiEndpoint,
  // //     sourceSigner: this.config.targetSigner,
  // //     sourceSignerSubapi: this.config.targetSignerSubapi,
  // //     sourceSignerRelayer: this.config.targetSignerRelayer,
  // //     targetSigner: this.config.sourceSigner,
  // //     targetSignerSubapi: this.config.sourceSignerSubapi,
  // //     targetSignerRelayer: this.config.sourceSignerRelayer,
  // //     sourceAddressSubapi: this.config.targetAddressSubapi,
  // //     sourceAddressRelayer: this.config.targetAddressRelayer,
  // //     targetAddressSubapi: this.config.sourceAddressSubapi,
  // //     targetAddressRelayer: this.config.sourceAddressRelayer,
  // //   };
  // //
  // //   const features = input.features;
  // //   switch (input.task) {
  // //     case StartTask.oracle: {
  // //       if (sourceToTargetConfig.enableSourceToTarget) {
  // //         const sourceToTargetLifecycle = await this.initOracleLifecycle(
  // //           sourceToTargetConfig,
  // //           RelayDirection.SourceToTarget,
  // //         );
  // //         const sourceToTargetRelayer = new OracleRelay(sourceToTargetLifecycle);
  // //         await sourceToTargetRelayer.start(features);
  // //       }
  // //
  // //       if (targetToSourceConfig.enableTargetToSource) {
  // //         const targetToSourceLifecycle = await this.initOracleLifecycle(
  // //           targetToSourceConfig,
  // //           RelayDirection.TargetToSource,
  // //         );
  // //         const targetToSourceRelayer = new OracleRelay(targetToSourceLifecycle);
  // //         await targetToSourceRelayer.start(features);
  // //       }
  // //       break;
  // //     }
  // //     case StartTask.relayer: {
  // //       if (sourceToTargetConfig.enableSourceToTarget) {
  // //         const sourceToTargetLifecycle = await this.initRelayerLifecycle(
  // //           sourceToTargetConfig,
  // //           RelayDirection.TargetToSource,
  // //         );
  // //         const sourceToTargetRelayer = new RelayerRelay(sourceToTargetLifecycle);
  // //         await sourceToTargetRelayer.start();
  // //       }
  // //
  // //       if (targetToSourceConfig.enableTargetToSource) {
  // //         const targetToSourceLifeCycle = await this.initRelayerLifecycle(
  // //           targetToSourceConfig,
  // //           RelayDirection.TargetToSource,
  // //         );
  // //         const targetToSourceRelayer = new RelayerRelay(targetToSourceLifeCycle);
  // //         await targetToSourceRelayer.start();
  // //       }
  // //       break;
  // //     }
  // //   }
  // //
  // }
  //

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
      sourceIndexerOracle: sourceIndexer.oracle(),
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
      throw new Error(`missing ${config.target.name} indexder endpoint`);
    }
    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerOrmp: sourceIndexer.ormp(),
      sourceIndexerRelayer: sourceIndexer.relayer(),
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
      oracleEndpoint: config.source.indexer,
      relayerEndpoint: config.source.indexer,
      ormpEndpoint: config.source.indexer,
      subapiEndpoint: config.source.indexer,
    }).thegraph();
  }

  private initTargetIndexer(config: OrmpRelayStartInput): ThegraphIndexer {
    return new OrmpipeIndexer({
      endpoint: config.target.indexer,
      oracleEndpoint: config.target.indexer,
      relayerEndpoint: config.target.indexer,
      ormpEndpoint: config.target.indexer,
      subapiEndpoint: config.target.indexer,
    }).thegraph();
  }
}
