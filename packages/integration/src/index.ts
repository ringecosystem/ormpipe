import {IntegrationTestConfig} from "./types/config";
import {ethers} from "ethers";

const abiOrmp = require('./abis/Ormp.json');
const abiMsgline = require('./abis/Msgline.json');

interface Lifecycle {
  evm: ethers.JsonRpcProvider,
  wallet: ethers.Wallet,
  contractOrmp: ethers.Contract,
  contractMsgline: ethers.Contract,
}

export class OrmpIntegrationTestProgram {

  private readonly lifecycle: Lifecycle;

  constructor(
    private readonly config: IntegrationTestConfig,
  ) {
    const evm = new ethers.JsonRpcProvider(config.endpoint);
    const wallet = new ethers.Wallet(config.signer, evm);
    const contractOrmp = new ethers.Contract(config.ormpAddress, abiOrmp, wallet);
    const contractMsgline = new ethers.Contract(config.msglineAddress, abiMsgline, wallet);
    this.lifecycle = {
      evm,
      wallet,
      contractOrmp,
      contractMsgline: contractMsgline,
    };
  }

  private _randomMessage(): string {
    let t = Math.random().toString().replace('0.', '')
    t = t.length % 2 == 0 ? t : t + '0';
    return `0x${t}`
  }

  // send test message
  public async sendOrmpMessage() {
    const { wallet, contractOrmp } = this.lifecycle;
    const message = this._randomMessage();
    const params = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const gasLimit = 10000;
    const fee = await contractOrmp['fee'](
      this.config.targetChainId, // toChainId
      wallet.getAddress(), // ua
      gasLimit, // gasLimit
      message, // encoded
      params, // params
    );
    const tx = await contractOrmp['send'](
      this.config.targetChainId, // toChainId
      wallet.getAddress(), // to
      gasLimit, // gasLimit
      message, // encoded
      wallet.getAddress(), // refund
      params, // params
      {value: fee},
    );
    const resp = await tx.wait();
    console.log(resp.hash);
  }


  public async sendMsglineMessage() {
    const { wallet, contractMsgline } = this.lifecycle;
    const message = this._randomMessage();
    const params = '0x00000000000000000000000000000000000000000000000000000000000493e0';
    const fee = await contractMsgline['fee'](
      this.config.targetChainId,
      wallet.getAddress(),
      message,
      params,
    );
    const tx = await contractMsgline['send'](
      this.config.targetChainId,
      wallet.getAddress(),
      message,
      params,
      {value: fee},
    );
    const resp = await tx.wait();
    console.log(resp.hash);
  }

}
