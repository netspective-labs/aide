# Netspective Labs Aide

[![codecov](https://codecov.io/gh/netspective-labs/factory/branch/main/graph/badge.svg?token=JK8J14Y5YY)](https://codecov.io/gh/netspective-labs/factory)

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
# .envrc configuration for unit testing
export RF_SQL_SHELL_OSQUERYI_LOCATION=`whereis -b osqueryi  | awk '{print $2}'`
export TESTVALID_PKC_PGUSER=gitlab_pkc_read_only
export TESTVALID_PKC_PGPASSWORD=*****
export GLTEST_PGUSER=gitlab_pkc_read_only
export GLTEST_PGPASSWORD==*****
```

Then:

```bash
direnv allow
deno test -A --unstable
```

## Legacy

The libraries in this monorepo were initially extracted from
[resFactory/lib](https://github.com/resFactory/factory/lib). Not all libraries
were initially migrated but if you need more code to do something special check
there first.
