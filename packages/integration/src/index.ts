import {IntegrationTestConfig} from "./types/config";
import {ethers} from "ethers";

const abiOrmp = require('./abis/Ormp.json');
const abiMsgline = require('./abis/Msgline.json');
const abiOracle = require('./abis/OrmpOracle.json');
const abiRelayer = require('./abis/OrmpRelayer.json');

interface Lifecycle {
  config: IntegrationTestConfig,
  evm: ethers.JsonRpcProvider,
  wallet: ethers.Wallet,
  contractOrmp: ethers.Contract,
  contractMsgline: ethers.Contract,
  contractOracle: ethers.Contract,
  contractRelayer: ethers.Contract,
}

export class OrmpIntegrationTestProgram {

  private readonly lifecycle: Lifecycle;

  constructor(
    private readonly config: IntegrationTestConfig,
  ) {
    const evm = new ethers.JsonRpcProvider(config.endpoint);
    const wallet = new ethers.Wallet(config.signer, evm);
    const contractOrmp = new ethers.Contract(config.addressOrmp, abiOrmp, wallet);
    const contractMsgline = new ethers.Contract(config.addressMsgline, abiMsgline, wallet);
    const contractOracle = new ethers.Contract(config.addressOracle, abiOracle, wallet);
    const contractRelayer = new ethers.Contract(config.addressRelayer, abiRelayer, wallet);
    this.lifecycle = {
      config,
      evm,
      wallet,
      contractOrmp,
      contractMsgline,
      contractOracle,
      contractRelayer,
    };
  }

  private _randomMessage(): string {
    let t = Math.random().toString().replace('0.', '')
    t = t.length % 2 == 0 ? t : t + '0';
    return `0x${t}`
  }


  private async _withdraw() {
    const {wallet, evm, contractOracle, contractRelayer} = this.lifecycle;

    const balanceOfSender = await evm.getBalance(wallet.getAddress());
    if (balanceOfSender > (100n * (10n ** 18n))) {
      return;
    }

    const balanceOfOracle = await evm.getBalance(this.config.addressOracle);
    const keepBalance = (2n * (10n ** 18n));

    if (balanceOfOracle > (keepBalance * 2n)) {
      const withdraw = balanceOfOracle - keepBalance;
      const tx = await contractOracle['withdraw'](
        wallet.getAddress(),
        withdraw
      );
      await tx.wait();
    }
    const balanceOfRelayer = await evm.getBalance(this.config.addressRelayer);
    if (balanceOfRelayer > (keepBalance * 2n)) {
      const withdraw = balanceOfRelayer - keepBalance;
      const tx = await contractRelayer['withdraw'](
        wallet.getAddress(),
        withdraw
      );
      await tx.wait();
    }
  }

  // send test message
  public async sendOrmpMessage() {
    await this._withdraw();
    const {wallet, contractOrmp} = this.lifecycle;
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
    const {wallet, contractMsgline} = this.lifecycle;
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
