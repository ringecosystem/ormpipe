import { ContractConfig, TransactionResponse } from "@darwinia/ormpipe-common";
import { ethers, keccak256 } from "ethers";
const TronWeb = require("tronweb");

const abi = require("../abis/Multisig.json");

export interface ImportMessageRootOptions {
  oracleContractAddress: string;
  importRootCallData: string;
  expiration: number;
  signatures: string;
}

export interface BuildSignOptions {
  oracleContractAddress: string;
  targetChainId: number;
  expiration: number;
  importRootCallData: string;
}

export class MultisigContractClient {
  private readonly config: ContractConfig;
  private readonly contract: ethers.Contract;
  private _tronweb: any;
  private _tronContract: any;

  constructor(config: ContractConfig) {
    this.config = config;
    const wallet = new ethers.Wallet(config.signer, config.evm);
    this.contract = new ethers.Contract(config.address, abi, wallet);
    if (this.config.chainName.toLowerCase().startsWith("tron")) {
      this._tronweb = new TronWeb({
        fullHost: this.config.endpoint,
        privateKey: this.config.signer,
      });
    }
  }

  public buildSign(options: BuildSignOptions): string {
    const toSignData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "address", "uint256", "uint256", "bytes"],
      [
        options.targetChainId, // target chain id
        this.config.address, // multisig address
        options.oracleContractAddress, // oracleV2 address
        0, // value, 0, don't need pay for it.
        options.expiration, // expiration
        options.importRootCallData, // call importMessageRoot
      ]
    );
    return keccak256(toSignData);
  }

  public async importMessageRoot(
    options: ImportMessageRootOptions
  ): Promise<TransactionResponse | undefined> {
    if (this._tronweb) {
      const tronPubKey = this._tronweb.address.toHex(
        this._tronweb.address.fromPrivateKey(this.config.signer)
      );
      console.log("importMessageRoot to Tron", tronPubKey);
      const unsignedTx =
        await this._tronweb.transactionBuilder.triggerSmartContract(
          this.config.address.replace("0x", "41"),
          "exec(address,uint256,uint256,bytes,bytes)",
          {},
          [
            { type: "address", value: options.oracleContractAddress },
            { type: "uint256", value: 0 },
            { type: "uint256", value: options.expiration },
            { type: "bytes", value: options.importRootCallData },
            { type: "bytes", value: options.signatures },
          ],
          // issuerAddress
          tronPubKey
        );
      console.log("tron tx: ", unsignedTx);
      const signedTx = await this._tronweb.trx.sign(
        unsignedTx.transaction,
        this.config.signer
      );
      return await this._tronweb.trx.broadcast(signedTx);
    } else {
      const tx = await this.contract["exec"](
        options.oracleContractAddress,
        0,
        options.expiration,
        options.importRootCallData,
        options.signatures
      );
      return await tx.wait();
    }
  }

  public async getOwners(): Promise<string[]> {
    if (this._tronweb) {
      if (!this._tronContract) {
        this._tronContract = await this._tronweb.contract(
          abi,
          this.config.address.replace("0x", "41")
        );
      }
      const owners = await this._tronContract["getOwners"]().call();
      for (let i = 0; i < owners.length; i++) {
        owners[i] = owners[i].replace("41", "0x");
      }
      console.log("getOwners on Tron", owners);
      return owners;
    } else {
      const owners = await this.contract["getOwners"]();
      return owners.map((item: any) => item.toString().toLowerCase());
    }
  }
}
