# Netspective Labs Aide

[![codecov](https://codecov.io/gh/netspective-labs/aide/branch/main/graph/badge.svg?token=A25ZFVJBHA)](https://codecov.io/gh/netspective-labs/aide)

`Aide` is Netspective Labs' helpers libraries monorepo. Sub-modules in this
library (e.g. `cache`, `sql`, `git`, etc.) should generally be independent of
each other, keeping dependencies to a minimum.

Member libraries of Netspective Labs `Aide` (`NLA`) should help to eliminate
dependencies in our project by writing minimal, testable, helpers without
unnecessarily relying on 3rd party libraries. For simple to medium complexity
requirements, it's better to write our own (well tested) code instead of relying
on 3rd parties. For high complexity code or widely used dependencies with many
contributors it's great to use 3rd party libraries.

## Tech Stack

The core `NLA` technology is `Deno` and our primary programming language is
_strict_ Typescript (not Javascript).

## Contributing

PRs are welcome. If you're making changes directly (without a PR), after
updating and before pushing code, tag the release:

```bash
# <git commit ...>
git-chglog --output CHANGELOG.md
git commit -m "auto generate content" CHANGELOG.md
git-semtag final && git push
# or git-semtag final -v "vN.N.N" && git push
```

## Unit Testing

Assuming you're using `direnv`, add this to `.envrc` or set the variables some
other way:

```bash
# .envrc configuration for unit testing, save PG passwords in ~/.pgpass and lookup using --conn-id
export RF_SQL_SHELL_OSQUERYI_LOCATION=`whereis -b osqueryi  | awk '{print $2}'`
export PGTEST_PGUSER=`./postgres/pgpass.ts prepare 'conn.username' --conn-id="FCR_GITLAB_PKC"`
export PGTEST_PGPASSWORD=`./postgres/pgpass.ts prepare 'conn.password' --conn-id="FCR_GITLAB_PKC"`
export GLTEST_PGUSER=`./postgres/pgpass.ts prepare 'conn.username' --conn-id="FCR_GITLAB_PKC"`
export GLTEST_PGPASSWORD=`./postgres/pgpass.ts prepare 'conn.password' --conn-id="FCR_GITLAB_PKC"`
```

Then:

```bash
direnv allow
deno test -A --unstable
```

[![Code Coverage](https://codecov.io/gh/netspective-labs/aide/branch/main/graphs/sunburst.svg?token=A25ZFVJBHA)](https://codecov.io/gh/netspective-labs/aide)

## Legacy

The libraries in this monorepo were initially extracted from
[resFactory/lib](https://github.com/resFactory/factory/lib). Not all libraries
were initially migrated but if you need more code to do something special check
there first.

### Not migrated yet and why

- `alasql` was being used for in-memory SQL and related code but we should use
  SQLite's in-memory model now. NOTE: since
  [AlaSQL 3.0](https://github.com/AlaSQL/alasql) has been released, check to see
  if there's value in doing the migration.
- `db` is a good Deno utility library for PostgreSQL client but no longer useful
  since Deno's NPM support affords many more, better, packages
- `knowledge` is the start of a knowledge management IM but isn't universal yet
- `notification` was used by the old resFactory admin UI and probably not
  universal
- `path` This is a tiny library and probably faster to just inline in code
- `presentation` are a custom HTML components strategy but we should React, et.
  al.
- `publication` formed the core of resFactory's SSG output but may not be
  universal
- `resource` formed the core of resFactory's resource acquisition and
  tranformation workflow but may not be universal
- `service-bus` was used for HTML UI and may no longer be useful
- `shell` is not as nice as `dax` or `dzx` which are not the preferred method of
  shelling out
- `smtp` was a Deno-specific wrapper when NPM packages were not available to
  Deno
- `strategy` is an OKRs and expectations framework whose universality might not
  be obvious
- `telemetry` should probabyl be replaced with OpenTelemetry SDK
- `tunnel` was used for HTML UI and may no longer be useful
