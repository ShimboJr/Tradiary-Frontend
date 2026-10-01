/**
 * api/integrations.js
 * Client-side API helpers for the integrations / MetaTrader token endpoints.
 */
import axios from './axiosInstance';

export const apiListIntegrationTokens  = ()          => axios.get('/integrations/tokens');
export const apiCreateIntegrationToken = (data)      => axios.post('/integrations/tokens', data);
export const apiRevokeIntegrationToken = (id)        => axios.delete(`/integrations/tokens/${id}`);
export const apiRegenerateIntegrationToken = (id)    => axios.post(`/integrations/tokens/${id}/regenerate`);
