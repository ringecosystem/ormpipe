import { Args, Command, Flags } from "@oclif/core";
import { IntegrationTestConfig } from "@darwinia/ormpipe-integration/dist/types/config";
import { CommandHelper } from "../common/commander";
import { OrmpIntegrationTestProgram } from "@darwinia/ormpipe-integration";
import { logger } from "@darwinia/ormpipe-common";

const camelize = require("camelize");

export default class Integration extends Command {
  static description = "describe the command here";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    from: Flags.string({
      required: true,
      description: "source chain",
      env: "ORMPIPE_CHAIN_FROM",
    }),
    to: Flags.string({
      required: true,
      description: "target chain",
      env: "ORMPIPE_CHAIN_TO",
    }),
    endpoint: Flags.string({
      required: false,
      description: "source chain endpoint",
      env: "ORMPIPE_ENDPOINT",
    }),
    signer: Flags.boolean({
      required: false,
      description: "signer interactively",
    }),
    "address-ormp": Flags.string({
      required: true,
      description: "ormp contract address",
      env: "ORMPIPE_ADDRESS_ORMP",
      default: "0xA72d283015c01807bc0788Bf22C1A774bDbFC8fA",
    }),
    "address-oracle": Flags.string({
      required: true,
      description: "ormp oracle address",
      env: "ORMPIPE_ADDRESS_ORACLE",
      default: "0x3f938756ceFa33665719Eb528E581FF3f460b7C6",
    }),
    "address-relayer": Flags.string({
      required: true,
      description: "ormp relayer address",
      env: "ORMPIPE_ADDRESS_RELAYER",
      default: "0xaC2b224c2E1eD2E8663097a361A05a72d6671C7D",
    }),
    "address-msgport": Flags.string({
      required: true,
      description: "message port contract address",
      env: "ORMPIPE_ADDRESS_MSGPORT",
      default: "0x8d22f03a675064BFd7509c87206d33730f33e324",
    }),
    "source-chain-id": Flags.integer({
      required: false,
      description: "source chain id",
      env: "ORMPIPE_SOURCE_CHAIN_ID",
    }),
    "target-chain-id": Flags.integer({
      required: false,
      description: "target chain id",
      env: "ORMPIPE_TARGET_CHAIN_ID",
    }),
    version: Flags.integer({
      required: true,
      description: "ormp version",
      env: "ORMP_VERSION",
      default: 2,
    }),
  };

  static args = {
    name: Args.string({
      required: true,
      description: "integration test name",
      options: [
        "withdraw",
        "send-message",
        "send-message-ormp",
        "send-message-msgport",
      ],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Integration);

    const rawIntegrationFlags = camelize(
      flags
    ) as unknown as IntegrationTestConfig;
    const integrationFlags = await this.buildFlag(rawIntegrationFlags);

    const definition = await CommandHelper.definition();
    const fromChain = definition.chain[integrationFlags.from];
    const toChain = definition.chain[integrationFlags.to];
    logger.info(`Test fromChain: ${fromChain.chainId}, toChain: ${toChain.chainId}`);
    integrationFlags.endpoint = fromChain.endpoint;
    integrationFlags.sourceChainId = fromChain.chainId;
    integrationFlags.targetChainId = toChain.chainId;

    const itp = new OrmpIntegrationTestProgram(integrationFlags);

    const name = args.name;
    switch (name) {
      case "withdraw":
        await itp.withdraw({ force: true });
        break;
      case "send-message":
      case "send-message-ormp":
        await itp.sendOrmpMessage();
        break;
      case "send-message-msgport":
        await itp.sendMsgportMessage();
        break;
      default:
        logger.warn("not support this test name");
        break;
    }
  }

  private async buildFlag(
    rawIntegrationFlags: IntegrationTestConfig
  ): Promise<IntegrationTestConfig> {
    const integrationFlags: IntegrationTestConfig = {
      ...rawIntegrationFlags,
    };
    const signer = await CommandHelper.interactiveValue({
      required: false,
      enable: !!integrationFlags.signer,
      type: "password",
      name: "signer",
      message: "missing --signer",
      title: "please type target signer for ormp contract",
      default: process.env.ORMPIPE_SIGNER,
    });
    return {
      ...integrationFlags,
      signer,
    } as IntegrationTestConfig;
  }
}
