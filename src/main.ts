#!/usr/bin/env node
import { Command } from "commander";
import { ConfigParser } from "./config_parser.js";
import { Executor } from "./executor.js";
import { ThriftClient } from "./thrift_client.js";

const program = new Command();

program.name("testengine").description("Parse and run JSON test trees").version("1.0.0");

program
  .command("parse")
  .requiredOption("--tree <path>", "JSON tree path")
  .option("--expand", "expand loop folders", false)
  .action((opts: { tree: string; expand: boolean }) => {
    let nodes = ConfigParser.load(opts.tree);
    if (opts.expand) nodes = ConfigParser.expandLoops(nodes);
    console.log(JSON.stringify(nodes, null, 2));
  });

program
  .command("save")
  .requiredOption("--tree <path>", "JSON tree path to write")
  .requiredOption("--from <path>", "source JSON")
  .action((opts: { tree: string; from: string }) => {
    const nodes = ConfigParser.load(opts.from);
    ConfigParser.save(opts.tree, nodes);
    console.log(`saved ${opts.tree}`);
  });

program
  .command("run")
  .requiredOption("--tree <path>", "JSON tree path")
  .option("--host <host>", "Thrift host", "127.0.0.1")
  .option("--port <port>", "Thrift port", "9090")
  .action(async (opts: { tree: string; host: string; port: string }) => {
    const nodes = ConfigParser.expandLoops(ConfigParser.load(opts.tree));
    const client = new ThriftClient(opts.host, Number(opts.port));
    const executor = new Executor((dll, fn, params) => client.callDll(dll, fn, params));

    process.on("SIGINT", () => {
      executor.stop();
    });

    const result = await executor.run(nodes);
    console.log("summary:", executor.nodes.summary());
    console.log("status:", result.status);
    if (result.error) console.error(result.error);
    process.exit(result.status === "success" ? 0 : 1);
  });

program.parse();
