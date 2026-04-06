import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useIOCs = (filters) => {
    return useQuery({
        queryKey: ['iocs', filters],
        queryFn: async () => {
            const res = await api.get('/iocs', { params: filters });
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useCVEs = (filters) => {
    return useQuery({
        queryKey: ['cves', filters],
        queryFn: async () => {
            const res = await api.get('/cves', { params: filters });
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useFeedsStatus = () => {
    return useQuery({
        queryKey: ['feeds'],
        queryFn: async () => {
            const res = await api.get('/feeds/status');
            return res.data;
        },
        refetchInterval: 30000,
    });
};
