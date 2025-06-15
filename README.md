# MitreKG
Attempt to build Knowledge Graph based on MITRE ATT&amp;CK and expand its use

## Required Software
```
- node v22.16.0
- neo4j Desktop
```

## How to Run
1. Install necessary software and packages in `package.json`
2. Create `.env` file with the following contents
```
NEO4J_URI = ...
NEO4J_USERNAME = ...
NEO4J_PASSWORD = ...
DATABASE_NAME = ...
```
3. Run the following command to save knowledge graph to Neo4j
```
npm run exec main.ts
```

## Noticable Relationship Explanation
- Attack Pattern
```
source_ref: attack-pattern-...
target_ref: attack-pattern-...
relationship_type: revoked-by
```
`source_ref` attack pattern is deprecated and switched to `target_ref` attack pattern. The external sources are the same, and only the `target_ref` resources are present in the MITRE ATT&amp;CK website. Only save `target_ref` in DB.

- Campaign and Intrusion Set
```
source_ref: campaign-...
target_ref: intrusion-set-...
relationship_type: attributed-to
```
`source_ref` campaign is a campaign under `target_ref` intrusion set. An intrusion set is usually a group does does one or more campaigns

- Intrusion Set
```
source_ref: intrusion-set-...
target_ref: intrusion-set-...
relationship_type: revoked_by
```
`source_ref` is deprecated and switched to `target_ref`. URL to `source_ref` redirects to `target_ref` URL. Only save `target_ref`

- Identity: No relationship entry. There is a relationship record in `created_by_ref` or `modified_by_ref` in other records

- Malware
```
source_ref: malware-...
target_ref: malware-... || tool-...
relationship_type: revoked_by
```
Same as other `revoked_by`. Some malwares are switched to tools

- x-mitre-data-source: No relationships. However, `x-mitre-data-component` has a link to it. We should add that relationship

- x-mitre-matrix: Does not have relationship entry. Instead, it has a list of `x-mitre-tactic` entries in `tactic_refs` as a list of ids.

- x-mitre-tactic: Does not have relationship entry. `attack-pattern` has `kill_chain_phases` that has the `phase_name` which can correspond to tactic names. Corresponds to `x_mitre_shortname` of `x-mitre-tactic`