import { IndexerInput } from "../types/indexer";
import { PonderIndexOrmp } from "./ormp";
import { PonderIndexSigncribe } from "./signcribe";
import { Gqlc } from "../gqlc";

export class PonderIndexer {
  private readonly ponderOrmp: PonderIndexOrmp;
  private readonly ponderSigncribe: PonderIndexSigncribe;

  constructor(input: IndexerInput) {
    const { endpoint, ormpEndpoint, signcribeEndpoint } = input;
    this.ponderOrmp = new PonderIndexOrmp(
      input,
      new Gqlc({
        timeout: input.timeout,
        endpoint: ormpEndpoint ?? endpoint,
      })
    );
    this.ponderSigncribe = new PonderIndexSigncribe(
      input,
      new Gqlc({
        timeout: input.timeout,
        endpoint: signcribeEndpoint ?? endpoint,
      })
    );
  }

  public ormp(): PonderIndexOrmp {
    return this.ponderOrmp;
  }

  public signcribe(): PonderIndexSigncribe {
    return this.ponderSigncribe;
  }
}
