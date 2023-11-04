import {Args, Command, Flags} from '@oclif/core'
import {IntegrationTestConfig} from "@darwinia/ormpipe-integration/dist/types/config";
import {CommandHelper} from "../common/commander";
import {OrmpIntegrationTestProgram} from "@darwinia/ormpipe-integration";
import {logger} from "@darwinia/ormpipe-logger";

const camelize = require('camelize');

export default class Integration extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'endpoint': Flags.string({
      required: true,
      description: 'source chain endpoint',
      env: 'ORMPIPE_ENDPOINT',
    }),
    'signer': Flags.boolean({
      required: false,
      description: 'signer interactively',
    }),
    'address-ormp': Flags.string({
      required: true,
      description: 'ormp contract address',
      env: 'ORMPIPE_ADDRESS_ORMP',
      default: '0x009D223Aad560e72282db9c0438Ef1ef2bf7703D',
    }),
    'address-oracle': Flags.string({
      required: true,
      description: 'ormp oracle address',
      env: 'ORMPIPE_ADDRESS_ORACLE',
      default: '0x00BD655DDfA7aFeF4BB109FE1F938724527B49D8',
    }),
    'address-relayer': Flags.string({
      required: true,
      description: 'ormp relayer address',
      env: 'ORMPIPE_ADDRESS_RELAYER',
      default: '0x003605167cd4C36063a7B63e604497e623Bb8B10',
    }),
    'address-msgline': Flags.string({
      required: true,
      description: 'message line contract address',
      env: 'ORMPIPE_ADDRESS_MSGLINE',
      default: '0x000c61ca18583c9504691f43ea43c2c638772487',
    }),
    'target-chain-id': Flags.integer({
      required: true,
      description: 'target chain id',
      env: 'ORMPIPE_TARGET_CHAIN_ID',
    }),
  }

  static args = {
    name: Args.string({
      required: true,
      description: 'integration test name',
      options: [
        'send-message',
        'send-message-ormp',
        'send-message-msgline',
      ],
    }),
  };

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Integration);

    const rawIntegrationFlags = camelize(flags) as unknown as IntegrationTestConfig;
    const integrationFlags = await this.buildFlag(rawIntegrationFlags);
    const itp = new OrmpIntegrationTestProgram(integrationFlags);

    const name = args.name;
    switch (name) {
      case 'send-message':
      case 'send-message-ormp':
        await itp.sendOrmpMessage();
        break;
      case 'send-message-msgline':
        await itp.sendMsglineMessage();
        break;
      default:
        logger.warn('not support this test name');
        break;
    }
  }

  private async buildFlag(rawIntegrationFlags: IntegrationTestConfig): Promise<IntegrationTestConfig> {
    const integrationFlags: IntegrationTestConfig = {
      ...rawIntegrationFlags,
    };
    const signer = await CommandHelper.interactiveValue({
      required: false,
      enable: !!integrationFlags.signer,
      type: 'password',
      name: 'signer',
      message: 'missing --signer',
      title: 'please type target signer for ormp contract',
      default: process.env.ORMPIPE_SIGNER,
    });
    return {
      ...integrationFlags,
      signer,
    } as IntegrationTestConfig;
  }
}
