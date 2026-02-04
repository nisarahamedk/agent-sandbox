#!/usr/bin/env node
import { Command } from "commander";
import { Sandbox } from "./sandbox.js";

const program = new Command();

program
  .name("agent-sandbox")
  .description("Run commands in a sandboxed container with secret injection")
  .version("0.1.0");

program
  .command("run")
  .description("Run a command inside a new sandbox")
  .requiredOption("-i, --image <image>", "Docker image to use")
  .option("-a, --allow <host>", "Allow outbound host (repeatable)", collect, [])
  .option(
    "-s, --secret <spec>",
    "Secret spec: NAME=VALUE@host1,host2 (repeatable)",
    collect,
    [],
  )
  .allowUnknownOption(true)
  .argument("<cmd...>", "Command to run")
  .action(async (cmd: string[], options) => {
    const allowNet = options.allow as string[];
    const secrets = parseSecrets(options.secret as string[]);

    const sandbox = await Sandbox.create({
      image: options.image as string,
      allowNet,
      secrets,
    });

    try {
      const result = await sandbox.exec(cmd.join(" "));
      if (result.stdout) process.stdout.write(result.stdout + "\n");
      if (result.stderr) process.stderr.write(result.stderr + "\n");
      process.exitCode = result.exitCode;
    } finally {
      await sandbox.close();
    }
  });

program.parse(process.argv);

function collect(value: string, previous: string[]) {
  return previous.concat([value]);
}

function parseSecrets(items: string[]) {
  const secrets: Record<string, { hosts: string[]; value: string }> = {};
  for (const item of items) {
    const [left, hostsPart] = item.split("@");
    if (!left || !hostsPart) {
      throw new Error(`Invalid secret spec: ${item}`);
    }
    const [name, ...valueParts] = left.split("=");
    const value = valueParts.join("=");
    if (!name || !value) {
      throw new Error(`Invalid secret spec: ${item}`);
    }
    secrets[name] = {
      value,
      hosts: hostsPart.split(",").map((h) => h.trim()).filter(Boolean),
    };
  }
  return secrets;
}
