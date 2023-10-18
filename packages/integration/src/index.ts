import {IntegrationTestConfig} from "./types/config";
import {ethers} from "ethers";

const abi = require('./abis/Ormp.json');

interface Lifecycle {
  evm: ethers.JsonRpcProvider,
  wallet: ethers.Wallet,
  contractOrmp: ethers.Contract,
}

export class OrmpIntegrationTestProgram {

  private readonly lifecycle: Lifecycle;

  constructor(
    private readonly config: IntegrationTestConfig,
  ) {
    const evm = new ethers.JsonRpcProvider(config.endpoint);
    const wallet = new ethers.Wallet(config.signer, evm);
    const contractOrmp = new ethers.Contract(config.ormpAddress, abi, wallet);
    this.lifecycle = {
      evm,
      wallet,
      contractOrmp,
    };
  }

  // send test message
  public async sendMessage() {
    const { wallet, contractOrmp } = this.lifecycle;
    const message = '0x1235';
    const params = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const fee = await contractOrmp['fee'](
      this.config.targetChainId,
      wallet.getAddress(),
      message,
      params,
    );
    const tx = await contractOrmp['send'](
      this.config.targetChainId,
      wallet.getAddress(),
      message,
      params,
      {value: fee},
    );
    console.log(tx);
  }
}