import axiosInstance from './axiosInstance';

export const apiListGoals    = ()         => axiosInstance.get('/goals');
export const apiCreateGoal   = (data)     => axiosInstance.post('/goals', data);
export const apiUpdateGoal   = (id, data) => axiosInstance.patch(`/goals/${id}`, data);
export const apiDeleteGoal   = (id)       => axiosInstance.delete(`/goals/${id}`);
