export type SecretConfig = {
  hosts: string[];
  value: string;
};

export type SandboxOptions = {
  image: string;
  allowNet?: string[];
  secrets?: Record<string, SecretConfig>;
  env?: Record<string, string>;
  name?: string;
  debugInjectHeader?: boolean;
};

export type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};
