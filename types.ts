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
                        | "course-of-action" 
                        | "campaign" 
                        | "x-mitre-tactic" 
                        | "x-mitre-data-component" 
                        | "tool" 
                        | "x-mitre-matrix" 
                        | "x-mitre-data-source"
                        | "x-mitre-asset"

export type ObjectDataType = {
    id: string,
    name: string,
    description: string,
    type: ObjectType,
    created: string,
    modified: string,
    url?: string,           // some types do not have external references
    external_id?: string,   // some types do not have external references
    first_seen?: string,    // campaign exclusive field
    last_seen?: string,     // campaign exclusive field
}

export type RelationshipType = "mitigates" 
                            | "uses" 
                            | "subtechniques-of" 
                            | "detects" 
                            | "revoked-by" 
                            | "attributed-to" 
                            | "component-of"
                            | "tactic-of"
                            | "techniques-of"

export type KillChainPhases = "reconnaissance" 
                            | "resource-development" 
                            | "initial-access" 
                            | "execution" 
                            | "persistence" 
                            | "privilege-escalation" 
                            | "defense-evasion"
                            | "credential-access" 
                            | "discovery" 
                            | "lateral-movement" 
                            | "collection" 
                            | "command-and-control" 
                            | "exfiltration" 
                            | "impact"

export type MitrePlatform = "Windows" 
                            | "Linux" 
                            | "macOS" 
                            | "Network Devices" 
                            | "ESXi" 
                            | "PRE" 
                            | "Containers" 
                            | "IaaS" 
                            | "SaaS" 
                            | "Office Suite" 
                            | "Identity Provider"
                            | "Android"
                            | "iOS"
                            | "Field Controller/RTU/PLC/IED"
                            | "Engineering Workstation"
                            | "Control Server"
                            | "Safety Instrumented System/Protection Relay"
                            | "Input/Output Server"
                            | "Embedded"
                            // ICS attack patterns have "None" platforms
                            // They imply multiple things
                            // - platform agnostic technique
                            // - conceptual or preparatory technique
                            // - The system an adversary is operating within; could be an operating system or application
                            | "None"

export type MitreDomain = "enterprise-attack" | "mobile-attack" | "ics-attack"