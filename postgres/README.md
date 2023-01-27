# PostgreSQL Aide

- `pgpass` module provides helpers for managing PostgreSQL connection
  credentials.

## SSH tunneling

If PostgreSQL is not on the same network, connect to a remote Postgres server
using SSH tunnel first. Assuming that Postgres listens on 5432 on remote:

```bash
ssh -fNTML 9432:localhost:5432 sshusername@you-server.com
```

Then, just launch psql, connecting to port 9432 at localhost:

```bash
psql -h localhost -p 9432 -U <username> <dbname>
```

## `pgpass` module

This module provides helpers for managing PostgreSQL connection credentials by
using typical `$HOME/.pgpass` file. The module supports adding custom
"descriptors" before the connection information.

See [.pgpass](https://www.postgresql.org/docs/current/libpq-pgpass.html) for
PostgreSQL-specific `.pgpass` documentation.

Before each .pgpass line you should include a strict JSON5L definition that
includes a line like
`{ id: "XYZ", description: "Purpose", boundary: "Network" }` where

- `id`: unique ID where "XYZ" will be used by pgpass.ts to identify connection
  (required)
- `description`: human=friendly elaboration of purpose (optional)
- `boundary`: human=friendly name of network or location of the connection
  (optional)

### `pgpass` binary installation

If you're using
[netspective-labs/home-polyglot](https://github.com/netspective-labs/home-polyglot),
`pgpass` is already installed in `$HOME/bin`.

If you're not using `netspective-labs/home-polyglot` you can
[install Deno](https://deno.land/manual@v1.30.0/getting_started/installation)
and then use `deno` to install the latest version of the binary:

```bash
export NLA_VERSION=`curl -fsSL https://api.github.com/repos/netspective-labs/aide/tags | jq '.[0].name' -r`
deno install -A -f --unstable https://raw.githubusercontent.com/netspective-labs/aide/${NLA_VERSION}/postgres/pgpass.ts
```

### `pgpass` usage

To test if the .pgpass definitions parse properly:

```bash
pgpass test
```

If you get no results, the file is valid otherwise you'll get an issues list

To see a list of all connections defined in .pgpass:

```bash
pgpass ls conn
```

To generate an arbitrary string for a connection ID:

```bash
pgpass prepare 'conn.database' --conn-id="GITLAB"       # simple
pgpass prepare '`${conn.database}`' --conn-id="GITLAB"  # custom JS eval-expr
```

If you need complex string formatting you can use Javascript evaluation. Be sure
to use '\`...\`' where ... is a JS string literal type that can use:
`${conn.host}` `${String(conn.port)}` `${conn.database}` `${conn.username}`
`${conn.password}`

To generate \`psql\`-friendly parameters for a given connection:

```bash
pgpass psql-fmt --conn-id="GITLAB"
```

You can use is like this:

```bash
fish -c "psql $(pgpass psql-fmt --conn-id='GITLAB')"
fish -c "pgcenter top $(pgpass psql-fmt --conn-id='GITLAB')"
```

To generate psql or pgcenter commands that you can use as-is:

```bash
pgpass psql --conn-id="GITLAB"      # emit the command
pgpass pgcenter --conn-id="GITLAB"  # emit the command

fish -c (pgpass psql --conn-id="GITLAB")     # run the command
fish -c (pgpass pgcenter --conn-id="GITLAB") # run the command
```

To generate env vars for all pgpass connections using default naming convetion:

```bash
pgpass env
```

To generate env vars for all pgpass connections using custom prefix:

```bash
pgpass env --var-name='`MYPREFIX_${varName}`'
```

To generate env vars for specific pgpass connections without prefix:

```bash
pgpass env --var-name='`${varName}`' --conn-id="GITHUB" --conn-id="GITLAB"
```

If you need complex string formatting you can use Javascript evaluation. Be sure
to use '\`...\`' where ... is a JS string literal type that can use:
`${varName}` `${conn.host}` `${String(conn.port)}` `${conn.database}`
`${conn.username}` `${conn.password}`

NOTE: --conn-id is passed into \`new RegExp(connId)\` so you can use any
parseable regex.

# TODO

- Provide Fish and Bash one-liners to use `pgpass` to generate combined SSH
  tunnel and, for example, `psql` in the same command. This would allow an
  almost-ready SASE or zero-trust security model?
- Use Deno compiler to
  [create single-binaries](https://deno.land/manual@v1.30.0/tools/compiler#compiling-executables)
  instead of requiring Deno installation?
