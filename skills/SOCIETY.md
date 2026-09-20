# Society Skill Architecture — Three Levels Up

This file is the routing layer above individual project skills.

It does **not** canonically activate Operator Moonshot Society. It is an implementation of the documented advisory structure for reusable project work.

## Agents, skills, connectors, societies, and swarms

An agent is a participant. A society describes relationships and responsibilities among participants; a swarm describes a pattern of coordination. The same agent can participate in both.

The levels below describe governance and reusable capabilities. An agent acts across those levels; a swarm is a coordination mode, not another mandatory level above Society.

| Component | Responsibility | Development example |
|---|---|---|
| Agent | Observe a situation, choose actions toward a goal, use permitted tools, and report outcomes. | A worker investigating a build failure. |
| Skill | Supply reusable instructions, procedures, and resources for a bounded workflow. | A build-and-test procedure. |
| Connector / MCP server | Expose supported data and actions through an authorized connection. | Reading editor diagnostics, if the particular connector supports it. |
| Plugin | Package skills, tool connections, or both for installation and reuse. | A development integration with a diagnostic workflow. |
| Society of agents | Organize membership, roles, communication, shared resources, obligations, and decision authority. | Builders, testers, and reviewers working under project agreements. |
| Swarm | Coordinate participants through local interactions and feedback that produce collective behavior. | Search workers adapting their exploration to findings from other workers. |

An agent is distinct from the model it uses, its assigned role, and its skill files. A model may support multiple agent instances. A role describes a responsibility; naming a role does not start a worker. One agent may use many skills, and many agents may share a skill. A skill does not require a dedicated agent, establish a connection, or grant permissions.

An agent executes or invokes an Operator under the existing contract. Its output remains subject to the evidence and admission requirements below. A software agent's role is not a model of a person's worth or standing.

### Society and swarm coordination

A Society may use a single worker, a coordinator with delegated workers, a review team, or a temporary swarm as the task warrants. Members can have different roles and goals; their obligations and conflicts must remain explicit.

For this architecture, record the actual coordination mechanism:

- **Single worker:** one agent applies the relevant skills and Operators.
- **Delegated team:** a coordinator allocates bounded tasks and reconciles results.
- **Swarm coordination:** participants adapt actions through declared local interactions or shared environmental signals; the collective behavior must be observed before a swarm-performance claim is made.

Parallel execution alone does not demonstrate swarm behavior. Calling workers a society does not canonically activate Operator Moonshot Society. Agreement among agents does not establish independent corroboration, especially when they share a model, prompt, or source.

### Proposed development workflow

An illustrative Visual Studio workflow would let a build agent use `build-test`, obtain diagnostics through an available connector or local development tools, and return the change and observations. Review work would apply `review-admit` with the evidence, predecessor, and rollback path. A temporary exploration swarm could be considered only when a bounded question benefits from that coordination pattern.

For each actual worker run, preserve the goal, role, current state, applicable skill/Operator versions, tool permissions, inputs and source identities, coordination method, cost budget, stop condition, outputs, failures, and evidence scope. For swarm experiments, also record the interaction rules, observed adaptation, and comparison with a single-worker or delegated-team baseline. Scheduling, communication, duplicate work, and review count toward cost.

This is a documented design example, not evidence that a Visual Studio connector is installed, an agent runtime is running, or a swarm has been executed. The connector's identity, available tools, connection state, and supported editor must be verified in the target environment before claiming access. Visual Studio and Visual Studio Code remain distinct products.

### Sources and scope

This section records the September 14, 2026 conversation clarification. The component mapping is an architectural synthesis; the development workflow is proposed. No new runtime or performance result is reported here.

- [OpenAI: Skills](https://developers.openai.com/plugins/concepts/skills) describes reusable workflows and the complementary roles of skills and MCP tools.
- [OpenAI: Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp) describes tool connections and the distinction between hosted and local configuration.
- [Sycara and Zeng: Coordination of Multiple Intelligent Software Agents](https://publications.ri.cmu.edu/storage/publications/pub_files/pub1/sycara_katia_1996_9/sycara_katia_1996_9.pdf) reports an implemented architecture with specialized agents and task-dependent collaboration. It does not verify this project's implementation.
- [Reynolds: Boids](https://www.red3d.com/cwr/boids/) provides an original example of coordinated group behavior arising from local rules. It does not establish effectiveness for language-model coding agents.

## Defining factor — one cooperative field

Current centralized authority: [Cooperative Field — START](../research/cooperative-field/README.md).  
Preserved source/predecessor: [We Are One — Defining Factors of the Cooperative Field](../research/history/2026-09-20-we-are-one-defining-factors.md).

~~~text
WE ARE ONE != WE ARE THE SAME
ONE = DISTINCTION + RELATION + CONTINUITY
~~~

This extends Society coordination without creating a master agent or shared-mind claim. Distinct members, roles, authorities, disagreements, evidence ceilings, and local state remain preserved inside one cooperative field.

UNITY != UNIFORMITY · RELATION != MERGE · COOPERATION != AUTHORITY · METHOD != EVIDENCE

## Level 0 — Skill

A skill is one bounded reusable transformation.

A skill must declare:

- trigger / applicability;
- required inputs;
- obligations it must preserve;
- procedure;
- outputs;
- evidence boundary;
- failure / stop conditions;
- completion test.

A skill does not authorize itself.

## Level +1 — Capability / Operator

An Operator is a skill plus an explicit reusable contract.

Operator record:

```text
Operator = (
  skill,
  applicability,
  input_contract,
  obligations,
  carrier_requirements,
  cost,
  evidence_requirement,
  failure_modes,
  output_contract,
  rollback
)
```

An Operator may be proposed or executed without becoming an admitted reusable capability.

Promotion requires evidence appropriate to the claimed scope.

`EXECUTED != VERIFIED != ADMITTED`

## Level +2 — Society / Orchestration

The Society layer receives a Situation and chooses the smallest useful composition of Operators.

Human control loop:

`NOTICE -> GOAL -> OBLIGATIONS -> HELPERS -> APPLICABILITY -> CHEAPEST INFORMATIVE TRY -> OBSERVE -> KEEP/REVISE/WIDEN -> REPEAT`

Machine loop:

`observe -> situation/obligation -> retrieve operators/carriers -> compose -> intervene -> preserve execution -> evaluate evidence -> verify -> evaluate lifecycle cost -> admit/archive -> transfer -> causal retest -> update scope`

The Society router must:

1. recover enough current state;
2. preserve authority and provenance;
3. identify consequential distinctions;
4. select the smallest applicable Operator set;
5. route execution to explicit carriers;
6. preserve every attempt and failure;
7. require evidence before promotion;
8. evaluate lifecycle cost and human burden;
9. admit, revise, archive, or leave unresolved;
10. keep rollback and predecessor identity available.

The Society is not a hidden model. Its state must remain inspectable data.

## Level +3 — Human Purpose / Constitutional Boundary

The Society is subordinate to affected human reality.

Before lower layers optimize anything, retain:

- human aim / need;
- minimal necessities for life, learning, and living;
- pursuit of happiness and room for curiosity/play;
- privacy and consent;
- accessibility and human reconstruction burden;
- ethics, safety, and dignity;
- cost, sustainability, attention, and opportunity cost;
- freedom to think, learn, communicate, dissent, create, and cooperate.

No lower layer may redefine these obligations merely because a representation, score, model, schema, or implementation makes another answer convenient.

### Constitutional invariants

- `PERSON != COMPONENT`
- `HUMAN_PURPOSE > SYSTEM_CONVENIENCE`
- `ACCESSIBILITY != OPTIONAL_POLISH`
- `CONSENT != INFERRED_PERMISSION`
- `LOCAL_STATE != EXTERNAL_AUTHORITY`
- `REFERENCE != EVIDENCE`
- `RETRIEVAL != CORROBORATION`
- `ROADMAP != IMPLEMENTED_STATE`
- `SUCCESSFUL_EXECUTION != SCIENTIFIC_VALIDITY`
- `LOWER_LAYER_OPTIMIZATION != AUTHORITY_TO_CHANGE_OBLIGATION`

## Current project Operators

The first three reusable Operators are:

1. `recover-bound` — recover current state and bind obligations/evidence scope;
2. `build-test` — execute the smallest informative change and record consequences;
3. `review-admit` — verify integrity, accessibility, economics, evidence, and decide admit/revise/archive/unresolved.

These three are intended to compose rather than proliferate into dozens of overlapping skills.

## ECS relationship

The ECS is the execution substrate below the Society:

- entities carry identity;
- components carry inspectable state;
- systems perform reusable transformations;
- carriers execute bounded actions;
- evidence gates determine what may advance;
- snapshots preserve continuity and restart;
- Society Operators select and govern ECS transformations;
- the human-purpose boundary remains above both.

`HUMAN PURPOSE -> SOCIETY -> OPERATORS -> ECS -> CARRIERS`

Authority flows downward only as explicitly granted. Evidence flows upward only with provenance.
