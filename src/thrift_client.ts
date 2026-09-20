import { getLogger } from "./logger.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ThriftClient {
  private readonly log = getLogger();

  constructor(
    private readonly host = "127.0.0.1",
    private readonly port = 9090
  ) {}

  async callDll(dll: string, fn: string, params: Record<string, unknown>): Promise<void> {
    this.log.info(`call ${dll}::${fn} ${JSON.stringify(params)}`);
    await sleep(250);
  }
}
