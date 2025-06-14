import TaxiiConnectionHandler from "./taxiiConnectionHandler"
import { RelationshipType } from "./types"

type KnowledgeGraphTuple = {
    source_ref: string,
    target_ref: string,
    relationship_type: RelationshipType
}

const taxiiConnectionHandler: TaxiiConnectionHandler = await TaxiiConnectionHandler.init("Enterprise ATT&CK")

const objects: any = (await taxiiConnectionHandler.getObjects())
                        .filter((object: any) => !object.x_mitre_deprecated && !object.revoked)

const id2ObjectMap: Record<string, any> = objects.reduce((acc: { [x: string]: any }, object: any) => {
    acc[object.id] = object
    return acc
}, {})

const knowledgeGraphTuples: KnowledgeGraphTuple[] = objects
                                                    .filter((object: any) => object.type === "relationship")
                                                    // you cannot access the source_ref of revoked-by relationship entries
                                                    .filter((relationshipObject: any) => relationshipObject.relationship_type !== "revoked-by")
                                                    .map((relationshipObject: any) => {
                                                        return {
                                                            source_ref: relationshipObject.source_ref,
                                                            target_ref: relationshipObject.target_ref,
                                                            relationship_type: relationshipObject.relationship_type
                                                        }
                                                    })

const tacticName2IdMap: Record<string, string> = objects
                        .filter((object: any) => object.type === "x-mitre-tactic")
                        .reduce((acc: { [x: string]: string }, object: any) => {
                            const name = object.x_mitre_shortname
                            acc[name] = object.id
                            return acc
                        }, {})

objects.forEach((object: any) => {
    if (object.type === "x-mitre-data-component") {
        const dataComponentId = object.id
        const dataSourceId = object.x_mitre_data_source_ref
        knowledgeGraphTuples.push({
            source_ref: dataComponentId,
            target_ref: dataSourceId,
            relationship_type: "component-of"
        })
    } else if (object.type === "x-mitre-matrix") {
        const tacticIds: string[] = object.tactic_refs
        tacticIds.forEach((tacticId: string) => {
            knowledgeGraphTuples.push({
                source_ref: tacticId,
                target_ref: object.id,
                relationship_type: "tactic-of"
            })
        })
    } else if (object.type === "attack-pattern") {
        const killChainPhases = object.kill_chain_phases
        killChainPhases.forEach((killChainPhase: Record<string, string>) => {
            const phaseName = killChainPhase.phase_name
            const tacticId = tacticName2IdMap[phaseName]
            knowledgeGraphTuples.push({
                source_ref: object.id,
                target_ref: tacticId,
                relationship_type: "techniques-of"
            })
        })
    }
})