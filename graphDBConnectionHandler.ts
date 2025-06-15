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
            const tx = this._session.beginTransaction()
            try {
                await tx.run(query, {
                    source_ref,
                    target_ref,
                    sourceProps,
                    targetProps,
                    description
                })
                await tx.commit()
                // await this._session.run(query, {
                //     source_ref,
                //     target_ref,
                //     sourceProps,
                //     targetProps,
                //     description,
                // })
                resolve()
            } catch (error: any) {
                await tx.rollback()
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
            const tx = this._session.beginTransaction()
            try {
                await tx.run(query, { id, platform })
                await tx.commit()
                // await this._session.run(query, { id, platform })
                resolve()
            } catch (error: any) {
                await tx.rollback()
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
            const tx = this._session.beginTransaction()
            try {                
                // await this._session.run(query, { id, domain })
                await tx.run(query, { id, domain })
                await tx.commit()
                resolve()
            } catch (error: any) {
                await tx.rollback()
                reject(error)
            }
        })
    }

    async insertSectorsAndRelatedAssets(id: string, object: any) {
        const sectors = object.x_mitre_sectors
        const relatedAssets = object.x_mitre_related_assets
        return new Promise<void>(async (resolve, reject) => {
            const tx = this._session.beginTransaction()
            try {
                for (const sector of sectors) {
                    await tx.run(
                        `
                            MATCH (a {id: $id})
                            MERGE (b: X_MITRE_SECTOR {name: $sector})
                            MERGE (a)-[r:RELATED_TO_SECTOR]->(b)
                        `
                    , { id, sector })
                }
                for (const relatedAsset of relatedAssets) {
                    const name = relatedAsset.name
                    const relatedAssetSectors = relatedAsset.related_asset_sectors
                    const description = relatedAsset.description

                    await tx.run(
                        `
                            MATCH (a {id: $id})
                            MERGE (b: X_MITRE_RELATED_ASSET {name: $name, description: $description})
                            MERGE (b)-[r:RELATED_TO_ASSET]->(a)
                        `
                    , { id, name, description })

                    for (const relatedAssetSector of relatedAssetSectors) {
                        await tx.run(
                            `
                                MATCH (a: X_MITRE_RELATED_ASSET {name: $name})
                                MERGE (b: X_MITRE_SECTOR {name: $relatedAssetSector})
                                MERGE (a)-[r:RELATED_TO_SECTOR]->(b)
                            `
                        , { name, relatedAssetSector })
                    }
                }

                await tx.commit()
                resolve()
            } catch (error: any) {
                await tx.rollback()
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