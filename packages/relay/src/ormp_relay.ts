import {OracleRealy} from "./relay/oracle";
import {RelayConfig} from "./types/config";

export class OrmpRelay {
  constructor(
    private readonly config: RelayConfig
  ) {
  }

  public async start() {
    // start ormp relay
    await this.initState();
    const relayer = new OracleRealy();
    await relayer.start();
  }
  
  private async initState() {
    // init state
    console.log(this.config);
  }
}
