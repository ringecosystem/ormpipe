import {RelayerRelayLifecycle} from "./types/config";
import {CommonRelay} from "@darwinia/ormpipe-common";
import {ThegraphIndexOrmp} from "@darwinia/ormpipe-indexer";
import {RelayerContractClient} from "./client/contract_relayer";

export class RelayerRelay extends CommonRelay<RelayerRelayLifecycle> {

  private _sourceRelayerContractClient?: RelayerContractClient;
  private _targetRelayerContractClient?: RelayerContractClient;

  constructor(lifecycle: RelayerRelayLifecycle) {
    super(lifecycle);
  }

  public get sourceIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.sourceIndexerOrmp
  }

  public get targetIndexerOrmp(): ThegraphIndexOrmp {
    return super.lifecycle.targetIndexerOrmp
  }

  public get sourceRelayerClient(): RelayerContractClient {
    if (this._sourceRelayerContractClient) return this._sourceRelayerContractClient;
    this._sourceRelayerContractClient = new RelayerContractClient({
      chainName: super.sourceName,
      signer: super.lifecycle.sourceSigner,
      address: super.lifecycle.sourceChain.contract.relayer,
      evm: super.sourceClient.evm,
    });
    return this._sourceRelayerContractClient;
  }

  public get targetRelayerClient(): RelayerContractClient {
    if (this._targetRelayerContractClient) return this._targetRelayerContractClient;
    this._targetRelayerContractClient = new RelayerContractClient({
      chainName: super.targetName,
      signer: super.lifecycle.targetSigner,
      address: super.lifecycle.targetChain.contract.relayer,
      evm: super.targetClient.evm,
    });
    return this._targetRelayerContractClient;
  }

  public async start() {
    console.log('relayer');
  }


}
