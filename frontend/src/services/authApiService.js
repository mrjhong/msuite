import { middlewareRequest } from "../utils/middleware";

export const apiAuthLogin = async (data) => {
    return await middlewareRequest('post', 'auth/login',data);
}
