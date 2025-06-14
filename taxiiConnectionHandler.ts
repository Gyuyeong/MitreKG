import axios, { Axios, AxiosInstance } from "axios"
import { CollectionEnum, CollectionType } from "./types"
import HTTPStatus from "./httpStatus"
import dotenv from "dotenv"

/**
 * This connection handler is written based on
 * endpoints described in https://attack-taxii.mitre.org/api-docs/#/
 */
class TaxiiConnectionHandler {
    _instance: AxiosInstance
    _collection: CollectionEnum
    _collectionId: string
    constructor () {
        this._instance = axios.create({
            headers: {
                Accept: 'application/taxii+json;version=2.1'
            },
            baseURL: 'https://attack-taxii.mitre.org/api/v21/'
        })
    }

    private async _getCollections(): Promise<CollectionType[]> {
        const url: string = 'collections'
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this._instance.get(url)
                const collections: CollectionType[] = response.data.collections.map((collection: any) => {
                    return {
                        id: collection.id,
                        title: collection.title,
                        description: collection.description,
                        can_read: collection.can_read,
                        can_write: collection.can_write,
                        media_types: collection.media_types
                    }
                })
                resolve(collections)
            } catch (error: any) {
                reject(error)
            }
        })
    }

    static async init(collection: CollectionEnum) {
        const connectionHandler = new TaxiiConnectionHandler()
        const collections: CollectionType[] = await connectionHandler._getCollections()
        const title2Id: Record<string, string> = collections.reduce((acc, { title, id }) => {
            acc[title] = id
            return acc
        }, {})
        connectionHandler._collectionId = title2Id[collection]
        return connectionHandler
    }

    async getObjects(): Promise<any> {
        const url = `collections/${this._collectionId}/objects`
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this._instance.get(url)
                resolve(response.data.objects)
            } catch (error: any) {
                reject(error)
            }
        })
    }

    async getObjectById(objectId: string): Promise<any> {
        const url = `collections/${this._collectionId}/objects/${objectId}`
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this._instance.get(url)
                resolve(response.data.objects[0])
            } catch (error: any) {
                reject(error)
            }
        })
    }
}

export default TaxiiConnectionHandler