import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook para obtener las postulaciones de un usuario.
 */
export const usePostulaciones = (userId: string) => {
  return useQuery({
    queryKey: ['postulaciones', userId],
    queryFn: async () => {
      const { data } = await api.get(`/postulaciones/usuario/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};
