# Private research-reader boundary

**Current state: `DESIGN_ONLY / PRIVATE_REMOTE_READER_DISABLED`.**

The public research-update feed is intentionally static and contains only explicitly admitted `public` records. It is not a private-reader service and it does not expose the local analytics ledger or POST/SSE ingestion path.

Before any remote private-reader surface is enabled, all of these gates are required:

1. TLS terminates at a reviewed deployment layer.
2. Authentication identifies an authorized reader or service; possession of a public URL is never authentication.
3. Authorization is enforced server-side before private material is selected or serialized.
4. Public and private data use separate payloads/endpoints; private content is never shipped to a browser and hidden with client-side filtering.
5. Admission is deny-by-default. Missing or ambiguous classification fails closed.
6. Retention, backup, rotation and deletion semantics are explicit.
7. Reader/service access can be revoked without rewriting public artifacts.
8. Logs minimize private content and credentials while preserving enough operations evidence to audit access.
9. Redaction rules are applied before any private record crosses the local boundary.
10. A production endpoint is independently checked after deployment; local tests do not establish remote security.

The local `analytics/server.py` transport is not automatically promoted into this role.

```text
LOCAL_LIVE_SERVICE != PRIVATE_REMOTE_READER
AUTHENTICATION != AUTHORIZATION
CLIENT_FILTERING != ACCESS_CONTROL
PUBLICATION != INDEPENDENT_EVIDENCE
```
