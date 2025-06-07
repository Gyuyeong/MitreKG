class HTTPStatus {
    static OK: 200
    static BAD_REQUEST: 400
    static UNAUTHORIZED: 401
    static FORBIDDEN: 403
    static NOT_FOUND: 404
    static TOO_MANY_REQUESTS: 429
    static INTERNAL_SERVER_ERROR: 500
    static BAD_GATEWAY: 502
    static SERVICE_UNAVAILABLE: 503
    static GATEWAY_TIMEOUT: 504

    static isClientError(status: number): boolean {
        if (status >= 400 && status < 500) return true
        return false
    }

    static isServerError(status: number): boolean {
        if (status >= 500) return true
        return false
    }
}

export default HTTPStatus