# Internal DNS for MMO beta

This is a **development/internal service-discovery plane**, not a public DNS resolver.

## Start

```sh
docker compose -f infra/internal-dns/compose.yaml up -d
python3 infra/internal-dns/probe_dns.py
```

The supplied profile exposes DNS only on host loopback `127.0.0.1:1053` (UDP/TCP) and CoreDNS metrics on `127.0.0.1:9153`. The zone served is only `beta.internal`; the Corefile contains no upstream-forwarding path.

## Protocol mapping

- **DU-SD/1** — `SRV` locates a beta service; `A/AAAA` locates its endpoint; `TXT` carries small bounded metadata.
- **DU-CAP/1** — `_du-cap.beta.internal TXT` advertises protocol versions. Advertisement is not authorization or health.
- **DU-WATCH/1** — `probe_dns.py` checks exact A/TXT/SRV expectations and verifies an external name is not recursively resolved.
- **DU-BT/1** — browser-side BLE/GATT companion contract; listed in DNS capability metadata but not transported by DNS.

## Security boundary

The profile pins the current official CoreDNS `1.14.6` release and enables only ordinary UDP/TCP DNS. A September 2026 CoreDNS advisory covers custom DoH/DoH3/DoQ/gRPC decoding paths through 1.14.6 and distinguishes them from its normal miekg/dns UDP/TCP server path. Those custom transports are not configured here. The host bindings are loopback-only; dynamic update and transfer mechanisms are not configured. Move to the patched official release when one is available.

Do not publish port 1053 or 9153 to the internet. A passing DNS probe proves only the declared resolution behavior, not application health, admission safety, or authorization.
