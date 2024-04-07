import { IndexerInput } from "../types/indexer";
import { PonderIndexOrmp } from "./ormp";
import { PonderIndexSigncribe } from "./signcribe";
import { Gqlc } from "../gqlc";

export class PonderIndexer {
  private readonly graphOrmp: PonderIndexOrmp;
  private readonly graphSigncribe: PonderIndexSigncribe;

  constructor(input: IndexerInput) {
    const { endpoint, ormpEndpoint, signcribeEndpoint } = input;
    this.graphOrmp = new PonderIndexOrmp(
      input,
      new Gqlc({
        timeout: input.timeout,
        endpoint: ormpEndpoint ?? endpoint,
      })
    );
    this.graphSigncribe = new PonderIndexSigncribe(
      input,
      new Gqlc({
        timeout: input.timeout,
        endpoint: signcribeEndpoint ?? endpoint,
      })
    );
  }

  public ormp(): PonderIndexOrmp {
    return this.graphOrmp;
  }

  public signcribe(): PonderIndexSigncribe {
    return this.graphSigncribe;
  }
}
