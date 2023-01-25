#!/usr/bin/env -S deno run -A

import * as c from "https://deno.land/std@0.173.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import docopt from "https://deno.land/x/docopt@v1.0.7/mod.ts";
import { Connection, parse } from "./pgpass-parse.ts";

// TODO: `pgpass.ts env --var-name` and `pgpass.ts prepare <js-eval-expr>` uses
//       unsafe `eval()` to format strings. This is unsafe on anything other
//       trusted machines so be careful. Find a string replacement library to
//       upgrade later.

const version = "0.9.0";
const cmd = path.basename(import.meta.url);
const pgPassFile = path.join(`${Deno.env.get("HOME")}`, ".pgpass");
const doc = `
Netspective Labs conventional .pgpass inspection.

Usage:
  ${cmd} ls conn [--src=<file>] [--no-color]
  ${cmd} env [--src=<file>] [--no-export] [--var-name=<js-expr>] [--conn-id=<matcher>...] [--warn-no-descriptors]
  ${cmd} prepare <js-eval-expr> --conn-id=<matcher>... [--all] [--src=<file>]
  ${cmd} (psql-fmt|psql|pgcenter) --conn-id=<matcher>... [--all] [--src=<file>]
  ${cmd} url --conn-id=<matcher>... [--all] [--src=<file>]
  ${cmd} test [--src=<file>]
  ${cmd} inspect [--src=<file>] [--mask-password] [--json]
  ${cmd} -h | --help
  ${cmd} --version

Options:
  -h --help               Show this screen.
  --src=<file>            The source of .pgpass content [default: ${pgPassFile}]
  --no-export             Don't add 'export' clause to emitted env var lines
  --var-name=<js-expr>    Env var name format [Default: \`\${conn.connDescr.id}_\${varName}\`]
  --conn-id=<matcher>     Connection ID matching regular expression(s) using JS \`new RegExp(connId)\`
  <js-eval-expr>          Javascript eval expression
  --all                   Produce all matching connections, not just the first one
  --warn-no-descriptors   Provide warning for which connections do not provide descriptors
  --json                  Emit in strict JSON format
  --version               Show version.

Help:
  To test if the .pgpass definitions parse properly:

    pgpass.ts test

    If you get no results, the file is valid otherwise you'll get an issues list

  To see a list of all connections defined in .pgpass:

    pgpass.ts ls conn

  To generate an arbitrary string for a connection ID:

    pgpass.ts prepare '\`\${conn.database}\`' --conn-id="GITLAB"

    Be sure to use '\`...\`' where ... is a JS string literal type that can use:
      \${conn.host} \${String(conn.port)} \${conn.database} \${conn.username} \${conn.password}

  To generate \`psql\`-friendly parameters for a given connection:

    pgpass.ts psql-fmt --conn-id="GITLAB"

    You can use is like this:

      psql \`pgpass.ts psql-fmt --conn-id="GITLAB"\`
      pgcenter top \`pgpass.ts psql-fmt --conn-id="GITLAB"\`

  To generate psql or pgcenter commands that you can use as-is:

    pgpass.ts psql --conn-id="GITLAB"
    pgpass.ts pgcenter --conn-id="GITLAB"

  To generate env vars for all pgpass connections using default naming convetion:

    pgpass.ts env

  To generate env vars for all pgpass connections using custom prefix:

    pgpass.ts env --var-name='\`MYPREFIX_\${varName}\`'

  To generate env vars for specific pgpass connections without prefix:

    pgpass.ts env --var-name='\`\${varName}\`' --conn-id="GITHUB" --conn-id="GITLAB"

  NOTE: --conn-id is passed into \`new RegExp(connId)\` so you can use any parseable regex.
`;

interface Arguments {
  readonly ls?: boolean;
  readonly "--no-color": boolean;

  readonly "--src": string;

  readonly env?: boolean;
  readonly "--var-name"?: string;
  readonly "--no-export"?: boolean;
  readonly "--conn-id"?: string[];
  "--warn-no-descriptors"?: boolean;
  connMatchers?: RegExp[];

  readonly test?: boolean;

  readonly inspect?: boolean;
  readonly "--json"?: boolean;
  readonly "--mask-password"?: boolean;

  readonly prepare?: boolean;
  readonly "<js-eval-expr>"?: string;
  prepareFormat?: (conn: Connection) => string;

  readonly psql?: boolean;
  readonly "psql-fmt"?: boolean;
  readonly pgcenter?: boolean;
  readonly url?: boolean;

  readonly "--all": boolean;

  readonly "--version"?: boolean;
  readonly "--help"?: boolean;
}

let args: Arguments;
try {
  args = docopt(doc) as unknown as Arguments;
  if (args.inspect) args["--warn-no-descriptors"] = true;
  args.connMatchers = args["--conn-id"] && args["--conn-id"].length > 0
    ? (args["--conn-id"].map((re) => new RegExp(re)))
    : undefined;
  if (args["psql-fmt"] || args.psql || args.pgcenter) {
    args.prepareFormat = (conn: Connection) =>
      // deno-fmt-ignore
      `${args["psql-fmt"] ? '' : args.psql ? 'psql' : 'pgcenter top'} -h ${conn.host} -p ${conn.port} -d ${conn.database} -U ${conn.username}`;
  }
  if (args.url) {
    args.prepareFormat = (conn: Connection) =>
      // deno-fmt-ignore
      `postgres://${conn.username}:${conn.password}@${conn.host}:${conn.port}/${conn.database}`;
  }
  if (args.prepare && args["<js-eval-expr>"]) {
    // deno-lint-ignore no-unused-vars
    args.prepareFormat = (conn: Connection) => {
      return eval(args["<js-eval-expr>"]!);
    };
  }
} catch (e) {
  console.error(e.message);
  Deno.exit(1);
}

if (args["--version"]) {
  console.log(`pgpass.ts version ${version}`);
  Deno.exit(0);
}

if (args["--help"]) {
  console.log(doc);
  Deno.exit(0);
}

const { conns, issues } = await parse(args["--src"], {
  maskPassword: args["--mask-password"]
    ? ((text) => "*".repeat(text.length))
    : undefined,
});

if (args.inspect) {
  if (args["--json"]) {
    console.log(JSON.stringify({ args, conns, issues }));
  } else {
    console.dir({ args, conns, issues });
  }
} else if (args.test) {
  // deno-fmt-ignore
  issues.forEach(i => {console.log(`${i.message} (line ${i.srcLineNumber})`); if (i.error) console.error(i.error)});
} else if (args.ls) {
  for (const conn of conns) {
    // deno-fmt-ignore
    console.log(args["--no-color"]
      ? `${conn.connDescr.id} ${conn.connDescr.description} ${`[${conn.host}:${conn.port} ${conn.username}@${conn.database}]`}`
      : `${c.brightYellow(conn.connDescr.id)} ${conn.connDescr.description} ${c.dim(`[${conn.host}:${conn.port} ${conn.username}@${conn.database}]`)}`);
  }
} else if (args.env) {
  const varNameFmt = args["--var-name"] ?? "`${conn.connDescr.id}_${varName}`";
  const exp = args["--no-export"] ? "" : "export ";
  // deno-lint-ignore no-unused-vars
  const prepare = (conn: Connection, varName: string, value: string) =>
    // conn, varName, and value are available to the "eval" function
    `${exp}${`${eval(varNameFmt)}`.toLocaleUpperCase()}="${value}"`;
  CONNS:
  for (const conn of conns) {
    if (args.connMatchers) {
      let matched = 0;
      for (const matcher of args.connMatchers) {
        if (conn.connDescr.id.match(matcher)) matched++;
      }
      if (matched == 0) continue CONNS;
    }
    console.log(prepare(conn, "PGHOST", conn.host));
    console.log(prepare(conn, "PGPORT", String(conn.port)));
    console.log(prepare(conn, "PGDATABASE", conn.database));
    console.log(prepare(conn, "PGUSER", conn.username));
    console.log(prepare(conn, "PGPASSWORD", conn.password));
  }
} else {
  if (args.prepareFormat && args.connMatchers) {
    CONN:
    for (const conn of conns) {
      for (const matcher of args.connMatchers) {
        if (conn.connDescr.id.match(matcher)) {
          console.log(args.prepareFormat(conn));
          if (!args["--all"]) break CONN;
        }
      }
    }
  } else {
    // if we get to here it means that arguments weren't handled properly
    console.error("[ERROR] Unable to determine course of action.");
    console.dir(args);
  }
}
