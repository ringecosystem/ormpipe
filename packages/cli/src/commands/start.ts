import {Command, Flags} from '@oclif/core'
import {
  ChainInfoFlag,
  CliStartConfig,
  OrmpRelay, OrmpRelayConfig,
  RelayFeature,
  StartTask
} from "@darwinia/ormpipe-relay-airnode"
import {CommandHelper} from "../common/commander";
import * as fs from 'fs';
import {logger} from "@darwinia/ormpipe-logger";

const REALY_CONFIG_DEFAULT = require('../assets/relay-chain.default.json');
const homedir = require('os').homedir();
const camelize = require('camelize')

export default class Start extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    tasks: Flags.string({
      char: 't',
      required: true,
      multiple: true,
      description: 'task name',
      options: Object.values(StartTask),
    }),
    features: Flags.string({
      required: false,
      multiple: true,
      description: 'features',
      options: Object.values(RelayFeature),
    }),
    'data-path': Flags.string({
      char: 'd',
      required: false,
      description: 'data path',
      env: 'ORMPIPE_DATA_PATH',
      default: `${homedir}/.ormpipe`,
    }),
    config: Flags.string({
      char: 'c',
      required: false,
      description: 'config file path',
      env: 'ORMPIPE_CONFIG',
      default: 'config.json',
    }),
    signer: Flags.boolean({
      required: false,
      description: 'signer interactively',
    }),
    'enable-pair': Flags.string({
      required: false,
      multiple: true,
      description: 'enable delivery pair',
    }),
  }

  static args = {
    // task: Args.string({
    //   required: true,
    //   description: 'relay task name',
    //   options: ['oracle', 'relayer'],
    // }),
  }

  public async run(): Promise<void> {
    const {flags} = await super.parse(Start)

    const cliStartConfig = camelize(flags) as unknown as CliStartConfig;
    const rawOrmpRelayChainInfo = await this.generateRelayChainInfo(cliStartConfig);
    const ormpRelayConfig = await this.buildFlag(cliStartConfig, rawOrmpRelayChainInfo);

    const ormpRelay = new OrmpRelay(ormpRelayConfig);
    try {
      await ormpRelay.start();
    } catch (e: any) {
      logger.error(e, {target: 'cli', breads: ['ormpipe', 'start']})
    }
  }

  private async generateRelayChainInfo(cliStartConfig: CliStartConfig): Promise<Record<string, ChainInfoFlag>> {
    const configFile = cliStartConfig.config;
    const _file = fs.existsSync(configFile) ? configFile : `${cliStartConfig.dataPath}/${configFile}`;
    if (!fs.existsSync(_file)) {
      return REALY_CONFIG_DEFAULT as unknown as Record<string, ChainInfoFlag>;
    }
    const content = fs.readFileSync(_file, {encoding: 'utf-8'});
    const parsed = JSON.parse(content);
    return parsed as unknown as Record<string, ChainInfoFlag>;
  }

  private async buildFlag(cliStartConfig: CliStartConfig, rawRelayChainInfo: Record<string, ChainInfoFlag>): Promise<OrmpRelayConfig> {
    const relayConfig: OrmpRelayConfig = {
      dataPath: cliStartConfig.dataPath,
      tasks: cliStartConfig.tasks,
      features: cliStartConfig.features ?? [
        RelayFeature.oracle_delivery,
        RelayFeature.oracle_aggregate,
      ],
      enablePair: cliStartConfig.enablePair,
      chain: rawRelayChainInfo,
      signer: cliStartConfig.signer,
    };
    const signer = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.signer,
      type: 'password',
      name: 'source-signer',
      message: 'missing --signer or ORMPIPE_SIGNER',
      title: 'please type source signer',
      default: process.env.ORMPIPE_SIGNER,
    });

    return {
      ...relayConfig,
      signer,
    } as OrmpRelayConfig;
  }

}
