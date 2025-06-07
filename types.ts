export type CollectionEnum = "Enterprise ATT&CK" | "Mobile ATT&CK" | "ICS ATT&CK"

export type CollectionType = {
    id: string,
    title: string
    description: string,
    can_read: boolean,
    can_write: boolean,
    media_types: string[]
}

export type ObjectType = "attack-pattern" 
                        | "malware" 
                        | "intrusion-set" 
                        | "x-mitre-collection" 
                        | "course-of-action" 
                        | "campaign" 
                        | "identity" 
                        | "relationship" 
                        | "x-mitre-tactic" 
                        | "x-mitre-data-component" 
                        | "tool" 
                        | "x-mitre-matrix" 
                        | "x-mitre-data-source"

export type RelationshipType = "mitigates" | "uses" | "subtechniques-of" | "detects" | "revoked-by" | "attributed-to"

export type RelationshipDataType = {
    id: string,
    modified: Date,
    created: Date,
    type: ObjectType,
    spec_verison: string,
    created_by_ref: string,
    revoked: boolean,
    object_marking_refs: string[],
    description: string,
    relationship_type: RelationshipType,
    source_ref: string,
    target_ref: string,
    x_mitre_modified_by_ref: string,
    x_mitre_deprecated: boolean,
    x_mitre_attack_spec_version: string,
    external_references: any[]
}