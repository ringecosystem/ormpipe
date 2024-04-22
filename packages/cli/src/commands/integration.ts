import {Args, Command, Flags} from '@oclif/core'
import {IntegrationTestConfig} from "@darwinia/ormpipe-integration/dist/types/config";
import {CommandHelper} from "../common/commander";
import {OrmpIntegrationTestProgram} from "@darwinia/ormpipe-integration";
import {logger} from "@darwinia/ormpipe-common";

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
      default: '0xa30daF3c6071361960aF29e52C1eC860a037886f',
    }),
    'address-oracle': Flags.string({
      required: true,
      description: 'ormp oracle address',
      env: 'ORMPIPE_ADDRESS_ORACLE',
      default: '0x0503c037719d7b39402a3ee9AA60b7ed604BB1f7',
    }),
    'address-relayer': Flags.string({
      required: true,
      description: 'ormp relayer address',
      env: 'ORMPIPE_ADDRESS_RELAYER',
      default: '0xA3B91e8Eb30825632Ca001a0a7c5839386ab838D',
    }),
    'address-msgport': Flags.string({
      required: true,
      description: 'message port contract address',
      env: 'ORMPIPE_ADDRESS_MSGPORT',
      default: '0xd7D1a5d67A6Ab825947Cf45664bF02f263FB73e9',
    }),
    'target-chain-id': Flags.integer({
      required: true,
      description: 'target chain id',
      env: 'ORMPIPE_TARGET_CHAIN_ID',
    }),
    'version': Flags.integer({
      required: true,
      description: 'ormp version',
      env: 'ORMP_VERSION',
      default: 2
    })
  }

  static args = {
    name: Args.string({
      required: true,
      description: 'integration test name',
      options: [
        'withdraw',
        'send-message',
        'send-message-ormp',
        'send-message-msgport',
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
      case 'withdraw':
        await itp.withdraw({force: true});
        break;
      case 'send-message':
      case 'send-message-ormp':
        await itp.sendOrmpMessage();
        break;
      case 'send-message-msgport':
        await itp.sendMsgportMessage();
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
