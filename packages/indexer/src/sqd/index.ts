import { IndexerInput } from "../types/indexer";
import { SqdIndexOrmp } from "./ormp";
import { SqdIndexSigncribe } from "./signcribe";
import { Gqlc } from "../gqlc";

export class SqdIndexer {
  private readonly _ormp: SqdIndexOrmp;
  private readonly _signcribe: SqdIndexSigncribe;

  constructor(input: IndexerInput) {
    const { endpoint, ormpEndpoint, signcribeEndpoint } = input;
    this._ormp = new SqdIndexOrmp(
      input,
      new Gqlc({
        timeout: input.timeout,
        endpoint: ormpEndpoint ?? endpoint,
      })
    );
    this._signcribe = new SqdIndexSigncribe(
      input,
      new Gqlc({
        timeout: input.timeout,
        endpoint: signcribeEndpoint ?? endpoint,
      })
    );
  }

  public ormp(): SqdIndexOrmp {
    return this._ormp;
  }

  public signcribe(): SqdIndexSigncribe {
    return this._signcribe;
  }
}
