import axios from "axios";
import loggerFactory from "@core/logger";

const logger = loggerFactory.create("http-client");

const httpClient = axios.create();
httpClient.interceptors.request.use(
    (config) => {
        logger.debug("HTTP client Request", {
            url: config.url,
            param: config.params,
            data: config.data
        })
        return config;
    },
    (error) => {
        logger.error("Unknown error", {
            error: error.message
        })
        return Promise.reject(error);
    }
)

httpClient.interceptors.response.use(
    (response) => {
        logger.debug("HTTP client Response", {
            data: response.data
        })
        return response
    },
    (error) => {
        if (axios.isAxiosError(error)) {
            logger.error("Telegram HTTP client error", {
                request: {
                    url: error.request.url,
                    data: error.request.data,
                },
                response: {
                    data: error.response?.data,
                    status: error.response?.status
                }
            })
        } else {
            logger.error("Unknown error", {
                error: error.message
            })
        }
        return Promise.reject(error);
    }
)

export default httpClient;