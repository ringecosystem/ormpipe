import * as enquirer from "enquirer";
import {ChainInfoFlag, CliBaseConfig, Definition, logger, RelayBaseConfig} from "@darwinia/ormpipe-common";
import {Flags} from "@oclif/core";
import axios, {AxiosResponse} from 'axios';
import YAML from 'yaml'

// const REALY_CONFIG_DEFAULT = require('../assets/relay-chain.default.json');

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

  public static async definition(): Promise<Definition> {
    const link = 'https://raw.githubusercontent.com/msgport/autoconf/main/ormpipe/definition.yml';
    const response: AxiosResponse = await axios.get(link);
    const rawData = response.data;
    return YAML.parse(rawData);
  }

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

  public static async generateRelayChainInfo(): Promise<Record<string, ChainInfoFlag>> {
    const {chain} = await this.definition();

    const chainNames = Object.keys(chain);
    for (const chainName of chainNames) {
      const envChainName = chainName.toUpperCase();
      const xEndpoint = process.env[`ORMPIPE_ENDPOINT_${envChainName}`];
      const xContractSigncribe = process.env[`ORMPIPE_CONTRACT_SIGNCRIBE_${envChainName}`];
      const xContractRelayer = process.env[`ORMPIPE_CONTRACT_RELAYER_${envChainName}`];
      const xContractOrmp = process.env[`ORMPIPE_CONTRACT_ORMP_${envChainName}`];
      const xContractOracle = process.env[`ORMPIPE_CONTRACT_ORACLE_${envChainName}`];
      const xContractMultisig = process.env[`ORMPIPE_CONTRACT_MULTISIG_${envChainName}`];
      const xIndexerOrmp = process.env[`ORMPIPE_INDEXER_ORMP_${envChainName}`];
      const xIndexerSigncribe = process.env[`ORMPIPE_INDEXER_SIGNCRIBE_${envChainName}`];
      const currentChain = chain[chainName];
      const currentChainContract = currentChain.contract;
      const currentChainIndexer = currentChain.indexer;
      currentChain.endpoint = xEndpoint ?? currentChain.endpoint;
      if (currentChainContract) {
        currentChainContract.signcribe = xContractSigncribe ?? currentChainContract.signcribe;
        currentChainContract.relayer = xContractRelayer ?? currentChainContract.relayer;
        currentChainContract.ormp = xContractOrmp ?? currentChainContract.ormp;
        currentChainContract.oracle = xContractOracle ?? currentChainContract.oracle;
        currentChainContract.multisig = xContractMultisig ?? currentChainContract.multisig;
      }
      if (currentChainIndexer) {
        currentChainIndexer.ormp = xIndexerOrmp ?? currentChainIndexer.ormp;
        currentChainIndexer.signcribe = xIndexerSigncribe ?? currentChainIndexer.signcribe;
      }

    }
    return chain;
  }

  public static async buildRelayConfig(cliStartConfig: CliBaseConfig): Promise<RelayBaseConfig[]> {
    const chainInfo = await this.generateRelayChainInfo(cliStartConfig);
    const pairs = cliStartConfig.enablePair;
    const works = [] as RelayBaseConfig[];
    const _SIGNER_BASE = process.env['ORMPIPE_SIGNER'];

    const _SIGNER_SIGNCRIBE = process.env[`ORMPIPE_SIGNER_SIGNCRIBE`];
    const signcribeSigner = await this.interactiveValue({
      required: true,
      enable: true,
      type: 'password',
      name: 'signer',
      message: 'missing signcribe signer',
      title: `please type signer for signcibe`,
      default: _SIGNER_SIGNCRIBE ?? _SIGNER_BASE,
    });

    for (const pair of pairs) {
      let source, target, symbol;
      if (pair.indexOf('-') > -1) {
        [source, target] = pair.split('-');
        symbol = '-';
      }
      if (pair.indexOf('>') > -1) {
        [source, target] = pair.split('>');
        symbol = '>';
      }
      if (pair.indexOf('<') > -1) {
        [source, target] = pair.split('<');
        symbol = '<';
      }
      // const [source, target] = pair.split('-');
      if (!source || !target) {
        continue;
      }
      logger.info('====== %s-%s ======', source, target, {target: 'ormpipe'});
      const sourceChain = chainInfo[source];
      const targetChain = chainInfo[target];
      if (!sourceChain) {
        throw new Error(`missing chain: ${source}`);
      }
      if (!targetChain) {
        throw new Error(`missing chain: ${target}`);
      }

      const _SIGNER_SOURCE = process.env[`ORMPIPE_SIGNER_${source.toUpperCase()}`];
      const _SIGNER_TARGET = process.env[`ORMPIPE_SIGNER_${target.toUpperCase()}`];

      const sourceSigner = await this.interactiveValue({
        required: true,
        enable: true,
        type: 'password',
        name: 'signer',
        message: 'missing source chain signer',
        title: `please type signer for ${source}`,
        default: _SIGNER_SOURCE ?? _SIGNER_BASE,
      });
      const targetSigner = await this.interactiveValue({
        required: true,
        enable: true,
        type: 'password',
        name: 'signer',
        message: 'missing target chain signer',
        title: `please type signer for ${target}`,
        default: _SIGNER_TARGET ?? _SIGNER_BASE,
      });

      const work = {
        // dataPath: cliStartConfig.dataPath,
        ...cliStartConfig,
        times: 0,
        symbol: symbol,
        sourceChain,
        sourceSigner: sourceSigner?.replace('0x', ''),
        targetChain,
        targetSigner: targetSigner?.replace('0x', ''),
        signcribeSigner: signcribeSigner?.replace('0x', ''),
      } as RelayBaseConfig;
      works.push(work);
    }
    return works;
  }

}

