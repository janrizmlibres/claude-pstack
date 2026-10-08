// The snapshot of upstream under `upstream/` and its machine-written record,
// `upstream/snapshot.json`, shared by upstream-diff and upstream-snapshot.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

export type SnapshotRecord = {
  /** Clone URL of the upstream repo. */
  repo: string;
  /** Full SHA the snapshot was taken at. */
  commit: string;
  /** pstack's version at that commit. */
  version: string;
  /** Upstream paths copied under `upstream/`, at the same relative paths. */
  paths: string[];
  /** ISO time the snapshot was taken. */
  taken: string;
};

export const snapshotDir = (root: string) => join(root, "upstream");
export const recordFile = (root: string) => join(snapshotDir(root), "snapshot.json");

/** Where pstack's version lives, relative to upstream's root. */
export const versionFile = "pstack/.cursor-plugin/plugin.json";

/** pstack's version in a checkout of upstream. */
export function readVersion(checkout: string, ref: string): string {
  const file = join(checkout, versionFile);
  if (!existsSync(file)) throw new UsageError(`${versionFile} is missing at ${ref}`);
  return (JSON.parse(readFileSync(file, "utf8")) as { version: string }).version;
}

/** Files under `upstream/` that belong to no recorded path, `snapshot.json` aside. */
export function strayFiles(root: string, paths: string[]): string[] {
  const dir = snapshotDir(root);
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => !entry.isDirectory())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .filter((file) => file !== "snapshot.json" && !paths.some((p) => file.startsWith(`${p}/`)))
    .sort();
}

/** Thrown for a failure the user can act on; the command prints it and exits 2. */
export class UsageError extends Error {}

export function readRecord(root: string): SnapshotRecord {
  const file = recordFile(root);
  if (!existsSync(file)) throw new UsageError(`no snapshot record at upstream/snapshot.json (looked in ${root})`);
  return JSON.parse(readFileSync(file, "utf8")) as SnapshotRecord;
}

export type ProcessResult = { code: number; stdout: string; stderr: string };

/** Run git with the user's excludes and colour switched off. */
export function gitRun(cwd: string, args: string[], env: Record<string, string> = {}): ProcessResult {
  const proc = Bun.spawnSync({
    cmd: ["git", "-c", "core.excludesFile=", "-c", "color.ui=false", ...args],
    cwd,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: proc.exitCode ?? -1, stdout: proc.stdout.toString(), stderr: proc.stderr.toString() };
}

/** As gitRun, but throw on failure and return stdout. */
export function git(cwd: string, args: string[], env: Record<string, string> = {}): string {
  const result = gitRun(cwd, args, env);
  if (result.code !== 0) throw new UsageError(`git ${args.join(" ")} failed:\n${result.stderr.trim()}`);
  return result.stdout;
}

/**
 * Run a command's main and exit with its code; a UsageError (including a bad
 * option) is printed as `<name>: <message>` and exits 2.
 */
export function runCommand(name: string, main: () => number): never {
  try {
    process.exit(main());
  } catch (error) {
    const usage = error instanceof UsageError || (error as { code?: string }).code?.startsWith("ERR_PARSE_ARGS");
    if (!usage) throw error;
    console.error(`${name}: ${(error as Error).message}`);
    process.exit(2);
  }
}

export type UpstreamClone = { dir: string; commit: string };

/**
 * A shallow, sparse clone of `repo` at `ref` holding only `paths`, in a temp
 * directory that is removed once `use` returns.
 */
export function withUpstreamClone<T>(
  repo: string,
  ref: string,
  paths: string[],
  use: (clone: UpstreamClone) => T,
): T {
  const dir = mkdtempSync(join(tmpdir(), "pstack-upstream-"));
  try {
    git(dir, ["init", "-q"]);
    git(dir, ["remote", "add", "origin", repo]);
    git(dir, ["sparse-checkout", "set", "--no-cone", ...paths.map((p) => `/${p}/`)]);
    git(dir, ["fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", ref]);
    git(dir, ["-c", "advice.detachedHead=false", "checkout", "-q", "FETCH_HEAD"]);
    const commit = git(dir, ["rev-parse", "HEAD"]).trim();
    return use({ dir, commit });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Hash the snapshot's working files into a tree in `clone`'s object store, as
 * upstream would track them (its own `.gitignore` files apply), and return
 * the tree's id. `snapshot.json` is not part of it.
 */
export function snapshotTree(clone: UpstreamClone, root: string, paths: string[]): string {
  const work = snapshotDir(root);
  const present = paths.filter((p) => existsSync(join(work, p)));
  const env = { GIT_INDEX_FILE: join(clone.dir, ".git", "snapshot.index") };
  const onSnapshot = ["--git-dir", join(clone.dir, ".git"), "--work-tree", work, "-c", "core.sparseCheckout=false"];
  if (present.length > 0) git(work, [...onSnapshot, "add", "-A", "--", ...present], env);
  return git(work, [...onSnapshot, "write-tree"], env).trim();
}
