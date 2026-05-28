# Phase 04 execution deviations

## Deferred (out of Antipattern Rule radius)

### test/http/http.test.ts — D-18 HTTP status discipline

- **Found during:** post-wave verification / full test suite
- **Issue:** Two failures — expired hosted identity expects 412 but handler returns 409; recovery terminal conflict expects 409 but handler returns 422
- **Reason not fixed inline:** `test/http/http.test.ts` not in any executed plan task `files_modified`
- **Recommendation:** Phase 05 HTTP status normalization or targeted plan with explicit files_modified
