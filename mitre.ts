import axios, { AxiosInstance } from "axios"

type MitreType = 
    "x-mitre-matrix" 
    | "course-of-action" 
    | "malware" 
    | "tool" 
    | "x-mitre-tactic" 
    | "attack-pattern" 
    | "x-mitre-data-component" 
    | "intrusion-set" 
    | "campaign" 
    | "x-mitre-data-source" 
    | "relationship"
    | "identity"
    | "marking-definition"

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

const readMitreJson = async (url: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await instance.get(url)
            resolve(response.data)
        } catch (error: any) {
            reject(error)
        }
    })
}

const data: any = await readMitreJson(enterpriseUrl)
console.log(data.type)
console.log(data.id)
console.log(data.spec_version)

const relationshipSet: Set<RelationshipType> = new Set()

const mappedData: Record<string, any> = {}
const relationshipList: string[] = []
data.objects.forEach((item: any) => {
    if (!item.x_mitre_deprecated) {
        const id = item.id
        mappedData[id] = item
        if (item.type === "relationship") {
            relationshipList.push(item.id)
        }
    }
})

const knowledgeGraphList: KGEntryType[] = []

relationshipList.forEach((relationship: string) => {
    const item = mappedData[relationship]
    const sourceRef: string = item.source_ref
    const targetRef: string = item.target_ref
    const relationshipType: RelationshipType = item.relationship_type

    knowledgeGraphList.push({
        sourceRef,
        targetRef,
        relationshipType
    })
})

console.log(knowledgeGraphList)