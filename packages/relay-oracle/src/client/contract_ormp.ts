import {ContractConfig} from "@darwinia/ormpipe-common";
import {ethers, EventLog, Log} from "ethers";

const abi = require("../abis/v2/Ormp.json");

export interface OrmpRootOptions {
  blockNumber: number
  msgIndex: number
}

export class OrmpContractClient {

  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
  }

  public async root(options: OrmpRootOptions): Promise<string | undefined> {
    const filters = this.contract.filters.MessageAccepted;
    const events: Array<EventLog | Log> = await this.contract.queryFilter(filters, options.blockNumber, options.blockNumber);

    /*
    // event.args
    [
      Result(3) [
        '0x40ea3ff606402c1e6d049b3a55f3047c89465f990df89f2cd177f184bad8d004',
        '0x4cb855b8c80705fe1e74b24c41be51c0763e3c999d804f15131f602ff78946ec',
        Result(8) [
          '0x00000000001523057a05d6293C1e5171eE33eE0A',
          43n,
          11155111n,
          '0x0000000000D2de3e2444926c4577b0A59F1DD8BC',
          44n,
          '0x0000000000D2de3e2444926c4577b0A59F1DD8BC',
          55450n,
          '0x394d1bca0000000000000000000000009f33a4809aa708d7a399fedba514e0a0d15efa850000000000000000000000009f33a4809aa708d7a399fedba514e0a0d15efa8500000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064d8e6817200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002123400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        ]
      ],
      Result(3) [
        '0x629085afc010324b694c0d40112ad5b5daca3bfa9bb33628a8b0307322c52ee8',
        '0x36fc8c4430a2235b33f1ed76677ec702cce7eacce4dde1542cd6ae8751291ede',
        Result(8) [
          '0x00000000001523057a05d6293C1e5171eE33eE0A',
          44n,
          11155111n,
          '0x0000000000D2de3e2444926c4577b0A59F1DD8BC',
          44n,
          '0x0000000000D2de3e2444926c4577b0A59F1DD8BC',
          55450n,
          '0x394d1bca0000000000000000000000009f33a4809aa708d7a399fedba514e0a0d15efa850000000000000000000000009f33a4809aa708d7a399fedba514e0a0d15efa8500000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064d8e6817200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002123400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        ]
      ]
    ]
     */

    // @ts-ignore
    const args = events.map(item => item.args);
    if (!args || !args.length) {
      return;
    }

    for (const arg of args) {
      const root = arg[1];
      const messages = arg[2];
      const [_, queriedMsgIndex] = messages;
      if (queriedMsgIndex != options.msgIndex) {
        continue;
      }
      return root;
    }
  }

}
