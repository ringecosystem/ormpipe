import * as enquirer from "enquirer";
import {ChainInfoFlag, CliBaseConfig, logger, RelayBaseConfig} from "@darwinia/ormpipe-common";
import {Flags} from "@oclif/core";
import * as fs from 'fs';
import {OracleRelayConfig} from "@darwinia/ormpipe-relay-oracle";

const REALY_CONFIG_DEFAULT = require('../assets/relay-chain.default.json');

const homedir = require('os').homedir();

export class CommandHelper {

  public static COMMON_FLAGS = {
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
    // signer: Flags.boolean({
    //   required: false,
    //   description: 'signer interactively',
    // }),
    'enable-pair': Flags.string({
      required: true,
      multiple: true,
      description: 'enable delivery pair',
    }),
  };

  public static async interactiveValue(options: {
    required: boolean,
    enable: boolean,
    type?: string,
    name: string,
    message?: string,
    title: string,
    default?: string,
  }): Promise<string | undefined> {
    let value = options.default;
    if (value) {
      return value;
    }

    if (options.enable) {
      const response: { field: string } = await enquirer.prompt({
        type: options.type ?? 'input',
        name: 'field',
        message: options.title,
        validate: async input => {
          if (!input) return options.title;
          return true;
        }
      });
      if (response.field) {
        value = response.field;
      }
    }

    if (!value && options.required) {
      logger.error(options.message ?? `missing ${options.name}`);
      process.exit(1);
    }
    return value;
  }

  public static async generateRelayChainInfo(cliStartConfig: CliBaseConfig): Promise<Record<string, ChainInfoFlag>> {
    const configFile = cliStartConfig.config;
    const _file = fs.existsSync(configFile) ? configFile : `${cliStartConfig.dataPath}/${configFile}`;
    if (!fs.existsSync(_file)) {
      return REALY_CONFIG_DEFAULT as unknown as Record<string, ChainInfoFlag>;
    }
    const content = fs.readFileSync(_file, {encoding: 'utf-8'});
    const parsed = JSON.parse(content);
    return parsed as unknown as Record<string, ChainInfoFlag>;
  }

  public static async buildRelayConfig(cliStartConfig: CliBaseConfig): Promise<RelayBaseConfig[]> {
    const chainInfo = await this.generateRelayChainInfo(cliStartConfig);
    const pairs = cliStartConfig.enablePair;
    const works = [] as RelayBaseConfig[];
    const _SIGNER_BASE = process.env['ORMPIPE_SIGNER'];

    for (const pair of pairs) {
      const [source, target] = pair.split('-');
      if (!source || !target) {
        continue;
      }
      logger.info('====== %s-%s ======', source, target, {target: 'ormpipe'});
      const sourceChain = chainInfo[source];
      const targetChain = chainInfo[target];

      const _SIGNER_SOURCE = process.env[`ORMPIPE_SIGNER_${source.toUpperCase()}`];
      const _SIGNER_TARGET = process.env[`ORMPIPE_SIGNER_${target.toUpperCase()}`];

      const sourceSigner = await this.interactiveValue({
        required: true,
        enable: true,
        type: 'password',
        name: 'signer',
        message: 'missing --signer',
        title: `please type signer for ${source}`,
        default: _SIGNER_SOURCE ?? _SIGNER_BASE,
      });
      const targetSigner = await this.interactiveValue({
        required: true,
        enable: true,
        type: 'password',
        name: 'signer',
        message: 'missing --signer',
        title: `please type signer for ${target}`,
        default: _SIGNER_TARGET ?? _SIGNER_BASE,
      });

      const work = {
        dataPath: cliStartConfig.dataPath,
        sourceChain,
        sourceSigner,
        targetChain,
        targetSigner,
      } as OracleRelayConfig;
      works.push(work);
    }
    return works;
  }

}

