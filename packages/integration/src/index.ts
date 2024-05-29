import { IntegrationTestConfig } from "./types/config";
import { ethers } from "ethers";
import axios, { AxiosResponse } from "axios";

const abiOrmp = require("./abis/v2/Ormp.json");
const abiMsgport = require("./abis/v2/Msgport.json");
const abiOracle = require("./abis/v2/Oracle.json");
const abiRelayer = require("./abis/v2/Relayer.json");

interface Lifecycle {
  config: IntegrationTestConfig;
  evm: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  contractOrmp: ethers.Contract;
  contractMsgport: ethers.Contract;
  contractOracle: ethers.Contract;
  contractRelayer: ethers.Contract;
}

export class OrmpIntegrationTestProgram {
  private readonly lifecycle: Lifecycle;

  constructor(private readonly config: IntegrationTestConfig) {
    const evm = new ethers.JsonRpcProvider(config.endpoint);
    const wallet = new ethers.Wallet(config.signer, evm);
    const contractOrmp = new ethers.Contract(
      config.addressOrmp,
      abiOrmp,
      wallet
    );
    const contractMsgport = new ethers.Contract(
      config.addressMsgport,
      abiMsgport,
      wallet
    );
    const contractOracle = new ethers.Contract(
      config.addressOracle,
      abiOracle,
      wallet
    );
    const contractRelayer = new ethers.Contract(
      config.addressRelayer,
      abiRelayer,
      wallet
    );
    this.lifecycle = {
      config,
      evm,
      wallet,
      contractOrmp,
      contractMsgport,
      contractOracle,
      contractRelayer,
    };
  }

  private _randomMessage(): string {
    let t = Math.random().toString().replace("0.", "");
    t = t.length % 2 == 0 ? t : t + "0";
    return `0x${t}`;
  }

  public async withdraw(options?: { force?: boolean }) {
    const { wallet, evm, contractOracle, contractRelayer } = this.lifecycle;

    const force = options?.force ?? false;
    if (!force) {
      const balanceOfSender = await evm.getBalance(wallet.getAddress());
      if (balanceOfSender > 100n * 10n ** 18n) {
        return;
      }
    }

    const balanceOfOracle = await evm.getBalance(this.config.addressOracle);
    console.log(`balance of oracle: ${balanceOfOracle}`);
    const keepBalance = 2n * 10n ** 18n;

    if (
      balanceOfOracle > keepBalance * 2n ||
      (force && balanceOfOracle > keepBalance)
    ) {
      const withdraw = balanceOfOracle - keepBalance;
      const tx = await contractOracle["withdraw"](
        wallet.getAddress(),
        withdraw,
        { gasLimit: 10n * 10000n }
      );
      const resp = await tx.wait();
      console.log(`withdraw (oracle): ${resp.hash}`);
    }
    const balanceOfRelayer = await evm.getBalance(this.config.addressRelayer);
    console.log(`balance of relayer: ${balanceOfRelayer}`);
    if (
      balanceOfRelayer > keepBalance * 2n ||
      (force && balanceOfRelayer > keepBalance)
    ) {
      const withdraw = balanceOfRelayer - keepBalance;
      const tx = await contractRelayer["withdraw"](
        wallet.getAddress(),
        withdraw,
        { gasLimit: 10n * 10000n }
      );
      const resp = await tx.wait();
      console.log(`withdraw (relayer): ${resp.hash}`);
    }
  }

  // send test message
  public async sendOrmpMessage() {
    await this.withdraw();
    const { wallet, contractOrmp } = this.lifecycle;
    const message = this._randomMessage();
    const params =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const gasLimit = 10000;
    const fee = await contractOrmp["fee"](
      this.config.targetChainId, // toChainId
      wallet.getAddress(), // ua
      gasLimit, // gasLimit
      message, // encoded
      params // params
    );
    const tx = await contractOrmp["send"](
      this.config.targetChainId, // toChainId
      wallet.getAddress(), // to
      gasLimit, // gasLimit
      message, // encoded
      wallet.getAddress(), // refund
      params, // params
      { value: fee }
    );
    const resp = await tx.wait();
    console.log(`send-ormp: ${resp.hash}`);
  }

  public async sendMsgportMessage() {
    await this.withdraw();
    const { wallet, contractMsgport } = this.lifecycle;

    // const enableRandomMessage = (+Math.random().toString().replace('0.', '')) % 2;
    const enableRandomMessage = 1;
    const accountAddress = await wallet.getAddress();

    let message;
    let toAddress = accountAddress;
    if (enableRandomMessage) {
      message = this._randomMessage();
    } else {
      message =
        "0xd8e68172000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000021234000000000000000000000000000000000000000000000000000000000000";
      const chainId = this.config.sourceChainId;
      if (chainId === 44) {
        switch (this.config.targetChainId) {
          case 421614: // crab -> arbsep
            toAddress = "0x1837ff30801f1793563451101350a5f5e14a0a1a";
            break;
        }
      }
      if (chainId === 421614) {
        switch (this.config.targetChainId) {
          case 44: // crab -> arbsep
            toAddress = "0x50d97aaf16afb178cb81bfa6910a33b18fa911e3";
            break;
        }
      }
    }

    let msgportFee;
    try {
      if (this.config.version == 1) {
        const ofee = await axios.get(
          "https://msgport-api.darwinia.network/ormp/fee",
          {
            params: {
              from_chain_id: this.config.sourceChainId,
              to_chain_id: this.config.targetChainId,
              payload: message,
              from_address: accountAddress,
              to_address: accountAddress,
              refund_address: accountAddress,
            },
          }
        );
        msgportFee = ofee.data.data;
      } else if (this.config.version == 2) {
        console.log("Request v2 msgport api");
        const ofee = await axios.get("http://api.msgport.xyz/ormp/fee", {
          params: {
            from_chain_id: this.config.sourceChainId,
            to_chain_id: this.config.targetChainId,
            payload: message,
            from_address: accountAddress,
            to_address: accountAddress,
            refund_address: accountAddress,
          },
        });
        console.log("V2 msgport api response", ofee.data);
        msgportFee = ofee.data.data;
      }
    } catch (e: any) {
      console.error("msgport api error: ", e);
      const response: AxiosResponse = e.response;
      throw new Error(
        `[msgport-api] [${response.data.code}] ${response.data.error}`
      );
    }
    if (msgportFee.code) {
      console.log("can not get fee from msgport api.", msgportFee);
      return;
    }
    const { fee, params } = msgportFee;

    const tx = await contractMsgport["send"](
      this.config.targetChainId,
      toAddress,
      message,
      params,
      { value: fee, gasLimit: 200000 }
    );
    const resp = await tx.wait();
    console.log(`send-msgport: ${resp.hash}`);
  }
}
