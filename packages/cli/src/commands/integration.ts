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
      default: '0x56F423Db036F2eDD05567b1211122E0B17C3bfF4',
    }),
    'address-oracle': Flags.string({
      required: true,
      description: 'ormp oracle address',
      env: 'ORMPIPE_ADDRESS_ORACLE',
      default: '0xeEa101d2c581C7426D719306B95D0c2B0578016B',
    }),
    'address-relayer': Flags.string({
      required: true,
      description: 'ormp relayer address',
      env: 'ORMPIPE_ADDRESS_RELAYER',
      default: '0xf8bb976bC369eedfbD5D3CEEB7077dc86EbC321D',
    }),
    'address-msgport': Flags.string({
      required: true,
      description: 'message port contract address',
      env: 'ORMPIPE_ADDRESS_MSGPORT',
      default: '0x2632B7BEd9Ec2665B85F6A9b79E350b81440EA13',
    }),
    'source-chain-id': Flags.integer({
      required: true,
      description: 'source chain id',
      env: 'ORMPIPE_SOURCE_CHAIN_ID',
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
