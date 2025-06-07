import TaxiiConnectionHandler from "./taxiiConnectionHandler"
import { RelationshipType } from "./types"

const taxiiConnectionHandler: TaxiiConnectionHandler = await TaxiiConnectionHandler.init("Enterprise ATT&CK")

const objects: any = await taxiiConnectionHandler.getObjects()

const id2ObjectMap: Record<string, any> = objects.reduce((acc: { [x: string]: any }, object: any) => {
    acc[object.id] = object
    return acc
}, {})

const knowledgeGraphTuples: { 
    sourceRef: string, 
    targetRef: string, 
    relationshipType: RelationshipType 
} = objects
        .filter((object: any) => object.type === "relationship")
        .filter((relationshipObject: any) => {
            const objectId = relationshipObject.id
            const source = id2ObjectMap[objectId]
            const target = id2ObjectMap[objectId]

            return !source.revoked && !target.revoked
        })
        .map((relationshipObject: any) => {
            return {
                sourceRef: relationshipObject.source_ref,
                targetRef: relationshipObject.target_ref,
                relationshipType: relationshipObject.relationship_type
            }
        })
console.log(knowledgeGraphTuples)