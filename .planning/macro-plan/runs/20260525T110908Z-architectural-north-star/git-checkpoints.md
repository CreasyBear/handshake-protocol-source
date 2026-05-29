# Git Checkpoints

## Invariant At Stake

Git history must separate planning reset from implementation and closeout
evidence so the architecture correction remains reconstructable.

## Checkpoints

| Commit | Purpose |
| --- | --- |
| `bdcec05` | Reset architecture macro plan around projection-over-spine north star. |
| `c8db729` | Implement projection map, docs, runtime same-envelope guard, tests, and validation evidence. |
| pending | Record closeout evidence after implementation commit. |

## Working Tree Notes

- `.DS_Store` generated workspace metadata was removed because the repo naming
  posture gate treats it as active-surface junk.
- No destructive git reset or checkout was used.
- `.planning/macro-plan` run evidence was force-added because `.planning/` is
  normally scratch, but this goal explicitly requires the macro-plan package and
  review evidence to be committed.
