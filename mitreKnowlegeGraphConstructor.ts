import TaxiiConnectionHandler from "./taxiiConnectionHandler"
import GraphDBConnectionHandler from "./graphDBConnectionHandler"
import { CollectionEnum, ObjectDataType, ObjectType, RelationshipType } from "./types"

type KnowledgeGraphTuple = {
    source_ref: string,
    target_ref: string,
    relationship_type: RelationshipType,
    description: string
}

class MitreKnowledgeGraphConstructor {
    private _objects: any
    private _knowledgeGraphTuples: KnowledgeGraphTuple[]
    constructor(objects: any) {
        this._objects = objects
    }

    static async init(collection: CollectionEnum) {
        console.log(`Fetching from ${collection}...`)
        const taxiiConnectionHandler: TaxiiConnectionHandler = await TaxiiConnectionHandler.init(collection)
        const objects: any = (await taxiiConnectionHandler.getObjects())
                            // disregard deprecated or revoked objects
                            .filter((object: any) => !object.x_mitre_deprecated && !object.revoked)
        console.log(`Fetched ${objects.length} objects`)
        return new MitreKnowledgeGraphConstructor(objects)
    }

    async run() {
        return new Promise<void>(async (resolve, reject) => {
            this._constructKnowledgeGraphTuples()
            try {
                await this._buildKnowledgeGraph()
                resolve()
            } catch (error: any) {
                reject(error)
            }
        })
    }

    private _constructKnowledgeGraphTuples() {
        const knowledgeGraphTuples: KnowledgeGraphTuple[] = this._objects
            .filter((object: any) => object.type === "relationship")
            // you cannot access the source_ref of revoked-by relationship entries
            .filter((relationshipObject: any) => relationshipObject.relationship_type !== "revoked-by")
            .map((relationshipObject: any) => {
                return {
                    source_ref: relationshipObject.source_ref,
                    target_ref: relationshipObject.target_ref,
                    relationship_type: relationshipObject.relationship_type,
                    description: relationshipObject.description ? relationshipObject.description : ""  // only some relationships have them
                }
            })
        const tacticName2IdMap: Record<string, string> = this._objects
            .filter((object: any) => object.type === "x-mitre-tactic")
            .reduce((acc: { [x: string]: string }, object: any) => {
                const name = object.x_mitre_shortname
                acc[name] = object.id
                return acc
            }, {})

        this._objects.forEach((object: any) => {
            if (object.type === "x-mitre-data-component") {
                const dataComponentId = object.id
                const dataSourceId = object.x_mitre_data_source_ref
                knowledgeGraphTuples.push({
                    source_ref: dataComponentId,
                    target_ref: dataSourceId,
                    relationship_type: "component-of",
                    description: "Source data component is under target data source"
                })
            } else if (object.type === "x-mitre-matrix") {
                const tacticIds: string[] = object.tactic_refs
                tacticIds.forEach((tacticId: string) => {
                    knowledgeGraphTuples.push({
                        source_ref: tacticId,
                        target_ref: object.id,
                        relationship_type: "tactic-of",
                        description: "source tactic is under target matrix"
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
                        relationship_type: "techniques-of", 
                        description: "source technique is under target tactic"
                    })
                })
            }
        })
        
        this._knowledgeGraphTuples = knowledgeGraphTuples
    }

    private async _buildKnowledgeGraph() {
        const excludedTypes: string[] = ["relationship", "identity"]
        const refMap: Record<string, ObjectDataType> = this._objects
            .filter((object: any) => !excludedTypes.includes(object.type))
            .reduce((acc: { [x: string]: any }, object: any) => {
            acc[object.id] = this._parseObject(object)
            return acc
        }, {})

        const platformConnectionTypes: ObjectType[] = ["attack-pattern", "tool", "malware", "x-mitre-data-source"]
        const domainConnectionTypes: ObjectType[] = ["intrusion-set", "course-of-action", "x-mitre-data-source"]

        const graphDBConnectionHandler = new GraphDBConnectionHandler()
        return new Promise<void>(async (resolve) => {
            // build from knowledge graph tuples
            for (const { source_ref, target_ref, relationship_type, description } of this._knowledgeGraphTuples) {
                const sourceProps: ObjectDataType = refMap[source_ref]
                const targetProps: ObjectDataType = refMap[target_ref]

                if (!sourceProps || !targetProps) continue
                try {
                    await graphDBConnectionHandler.insertNodesAndRelationship(
                        source_ref, 
                        target_ref, 
                        relationship_type, 
                        description, 
                        sourceProps,
                        targetProps
                    )
                } catch (error: any) {
                    console.error(`source: ${JSON.stringify(sourceProps)}\ntarget: ${JSON.stringify(targetProps)}\nrelationship_type: ${relationship_type}\ndescription: ${description}\nError: ${error}`)
                    continue
                }
            }

            // insert platform connection and domain connection
            for (const object of this._objects) {
                const id = object.id
                if (platformConnectionTypes.includes(object.type)) {
                    const platforms = object.x_mitre_platforms
                    for (const platform of platforms) {
                        try {
                            await graphDBConnectionHandler.insertPlatformConnection(id, platform)
                        } catch (error: any) {
                            console.error(`id: ${id}\nPlatform: ${platform}\nError: ${error}`)
                            continue
                        }
                    }
                } else if (domainConnectionTypes.includes(object.type)) {
                    const domains = object.x_mitre_domains
                    for (const domain of domains) {
                        try {
                            await graphDBConnectionHandler.insertDomainConnection(id, domain)
                        } catch (error: any) {
                            console.error(`id: ${id}\nDomain: ${domain}\nError: ${error}`)
                            continue
                        }
                    }
                }
            }

            await graphDBConnectionHandler.close()
            resolve()
        })
    }

    private _parseObject(object: any): ObjectDataType {
        const parsedObject = {
            id: object.id,
            name: object.name,
            description: object.description,
            type: object.type,
            created: new Date(object.created).toISOString(),
            modified: new Date(object.modified).toISOString()
        }
        const external_references = object.external_references
        if (external_references && external_references.length > 0) {
            for (const external_reference of external_references) {
                if (external_reference.source_name === "mitre-attack") {
                    parsedObject["url"] = external_reference.url
                    parsedObject["external_id"] = external_reference.external_id
                    break
                }
            }
        }

        if (object.type === "campaign") {
            parsedObject["first_seen"] = new Date(object.first_seen).toISOString()
            parsedObject["last_seen"] = new Date(object.last_seen).toISOString()
        }

        return parsedObject
    }
}

export default MitreKnowledgeGraphConstructor