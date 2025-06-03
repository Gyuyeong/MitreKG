import axios, { AxiosInstance } from "axios"
import neo4j from "neo4j-driver"
import dotenv from "dotenv"

dotenv.config()

type STIXBundleType = {
    type: string,
    id: string,
    objects: any[],
    spec_version: string
}

type STIXPropertyType = {
    id: string,
    name: string,
    type: string,
    description: string,
}

type RelationshipType = 
    "uses"
    | "mitigates"
    | "detects"
    | "subtechnique-of"
    | "revoked-by"
    | "attributed-to"

type KGEntryType = {
    sourceRef: string,
    targetRef: string,
    relationshipType: RelationshipType
}

const enterpriseUrl: string = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
const mobileUrl: string = "https://raw.githubusercontent.com/mitre/cti/master/mobile-attack/mobile-attack.json"
const icsUrl: string = "https://raw.githubusercontent.com/mitre/cti/master/ics-attack/ics-attack.json"

const instance: AxiosInstance = axios.create({
    headers: {
        'Accept': 'application/json'
    }
})

const readMitreJson = async (url: string): Promise<STIXBundleType> => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await instance.get(url)
            resolve(response.data)
        } catch (error: any) {
            reject(error)
        }
    })
}

const stixBundle: STIXBundleType = await readMitreJson(enterpriseUrl)

const isRevoked = (object: any): boolean => {
    if (object.revoked) return true
    return false
}

// Neo4j does not support nested Objects
// We may want to add more information by flattening
const id2StixMap: Record<string, STIXPropertyType> = stixBundle.objects.reduce((acc, object) => {
    if (!object.x_mitre_deprecated && !isRevoked(object)) {
        acc[object.id] = {
            id: object.id,
            name: object.name ? object.name : "",
            type: object.type,
            description: object.description ? object.description : "",
            source_ref: object.source_ref ? object.source_ref : null,
            target_ref: object.target_ref ? object.target_ref : null,
            relationship_type: object.relationship_type ? object.relationship_type: null,

        }
    }
    return acc
}, {})

const relationshipIdList: string[] = stixBundle.objects
                                                .filter((object: any) => !object.x_mitre_deprecated && object.type === "relationship")
                                                .map((object: any) => object.id)
                                                .filter((relationshipId: string) => id2StixMap[relationshipId])

const knowledgeGraphList: KGEntryType[] = relationshipIdList
                                                .map((relationshipId: string) => {
                                                    const object: any = id2StixMap[relationshipId]
                                                    const sourceRef: string = object.source_ref
                                                    const targetRef: string = object.target_ref
                                                    const relationshipType: RelationshipType = object.relationship_type

                                                    return {
                                                        sourceRef,
                                                        targetRef,
                                                        relationshipType
                                                    }
                                                })

const neo4jURI: string = process.env.NEO4J_URI as string
const username: string = process.env.NEO4J_USERNAME as string
const password: string = process.env.NEO4J_PASSWORD as string

const driver = neo4j.driver(
    neo4jURI,
    neo4j.auth.basic(username, password)
)

const buildKnowledgeGraph = async (kgEntires: KGEntryType[], refMap: Record<string, any>) => {
    return new Promise(async (resolve, reject) => {
        const session = driver.session({
            database: process.env.DATABASE_NAME,
            defaultAccessMode: neo4j.session.WRITE
        })

        try {
            for (const { sourceRef, targetRef, relationshipType } of kgEntires) {
                const sourceProps = refMap[sourceRef]
                const targetProps = refMap[targetRef]
                if (!sourceProps || !targetProps) continue
                await session.run(
                    `
                    MERGE (a:Entity {ref: $sourceRef})
                    SET a += $sourceProps
                    MERGE (b:Entity {ref: $targetRef})
                    SET b += $targetProps
                    MERGE (a)-[r:${relationshipType.toUpperCase().replace(/-/g, '_')}]->(b)
                    `,
                    {
                        sourceRef,
                        targetRef,
                        sourceProps,
                        targetProps
                    }
                )
            }
            resolve(true)
        } catch (error: any) {
            reject(error)
        } finally {
            await session.close()
            await driver.close()
        }
    })
}

buildKnowledgeGraph(knowledgeGraphList, id2StixMap)