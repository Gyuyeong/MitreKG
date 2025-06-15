import neo4j, { Driver, Session } from "neo4j-driver"
import dotenv from "dotenv"
import { MitreDomain, MitrePlatform, ObjectDataType } from "./types"

dotenv.config()

class GraphDBConnectionHandler {
    private _driver: Driver
    private _session: Session
    constructor() {
        const uri = process.env.NEO4J_URI as string
        const username = process.env.NEO4J_USERNAME as string
        const password = process.env.NEO4J_PASSWORD as string
        const dbName = process.env.DATABASE_NAME as string

        this._driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
        this._session = this._driver.session({
            database: dbName,
            defaultAccessMode: neo4j.session.WRITE
        })
    }

    async insertNodesAndRelationship(
        source_ref: string, 
        target_ref: string, 
        relationship_type: string, 
        description: string,
        sourceProps: ObjectDataType,
        targetProps: ObjectDataType,
    ) {
        const query = `
            MERGE (a:${sourceProps.type.toUpperCase().replace(/-/g, '_')} {id: $source_ref})
            SET a += $sourceProps
            MERGE (b:${targetProps.type.toUpperCase().replace(/-/g, '_')} {id: $target_ref})
            SET b += $targetProps
            MERGE (a)-[r:${relationship_type.toUpperCase().replace(/-/g, '_')}]->(b)
            SET r.description = $description
        `

        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._session.run(query, {
                    source_ref,
                    target_ref,
                    sourceProps,
                    targetProps,
                    description,
                })
                resolve()
            } catch (error: any) {
                reject(error)
            }
        })
    }

    async insertPlatformConnection(id: string, platform: MitrePlatform) {
        const query = `
            MATCH (a {id: $id})
            MERGE (b: PLATFORM {name: $platform})
            MERGE (a)-[r:RELATED_TO_PLATFORM]->(b)
        `
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._session.run(query, { id, platform })
                resolve()
            } catch (error: any) {
                reject(error)
            }
        })
    }

    async insertDomainConnection(id: string, domain: MitreDomain) {
        const query = `
            MATCH (a {id: $id})
            MERGE (b: DOMAIN {name: $domain})
            MERGE (a)-[r:RELATED_TO_DOMAIN]->(b)
        `
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._session.run(query, { id, domain })
                resolve()
            } catch (error: any) {
                reject(error)
            }
        })
    }

    async close() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._session.close()
                await this._driver.close()
                resolve()
            } catch (error: any) {
                reject(error)
            }
        })
    }
}

export default GraphDBConnectionHandler