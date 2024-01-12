import {OracleRelayLifecycle} from "./types/config";
import {CommonRelay} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {Oracle2ContractClient} from "./client/contract_oracle2";
import {SigncribeContractClient} from "./client/contract_signcribe";

export class OracleRelay extends CommonRelay<OracleRelayLifecycle> {

  private _targetOracle2ContractClient?: Oracle2ContractClient;
  private _signcribeContractClient?: SigncribeContractClient;

  constructor(lifecycle: OracleRelayLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp
  }

  public get targetIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.targetIndexerOrmp
  }

  public get targetOracle2Client(): Oracle2ContractClient {
    if (this._targetOracle2ContractClient) return this._targetOracle2ContractClient;
    this._targetOracle2ContractClient = new Oracle2ContractClient({
        chainName: super.sourceName,
        signer: super.lifecycle.targetSigner,
        address: super.lifecycle.targetChain.contract.relayer,
        evm: super.sourceClient.evm,
    });
    return this._targetOracle2ContractClient;
  }

  public get signcribeClient(): SigncribeContractClient {
    if (this._signcribeContractClient) return this._signcribeContractClient;
    this._signcribeContractClient = new SigncribeContractClient({
      chainName: super.sourceName,
      signer: super.lifecycle.sourceSigner,
      address: super.lifecycle.sourceChain.contract.relayer,
      evm: super.sourceClient.evm,
    });
    return this._signcribeContractClient;
  }

  public async start() {
    console.log(this.lifecycle);
  }

}
