# Visual Carrier V2 Boundary

This surface is downstream of the existing ECS scene-video jobs.

- `VISUAL_CARRIER != WORLD_AUTHORITY`
- `VISUAL_INTERPRETATION != WORLD_FACT`
- `VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON`
- `QUALITY_MAY_INCREASE_WITHOUT_AUTHORITY_INCREASING`

`core.mjs` and `ecs.mjs` remain authoritative for the existing imported game semantics. Files under this directory may interpret render jobs, but must not write visual choices back into world/ECS authority.
