import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useCV = (userId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cv', userId],
    queryFn: async () => {
      const { data } = await api.get(`/cv/${userId}`);
      return data;
    },
    enabled: !!userId,
  });

  const updateExperiencia = useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.patch(`/cv/${userId}/experiencia`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv', userId] });
    },
  });

  const updateEducacion = useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.patch(`/cv/${userId}/educacion`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv', userId] });
    },
  });

  const updateHabilidades = useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.patch(`/cv/${userId}/habilidades`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv', userId] });
    },
  });

  return {
    ...query,
    updateExperiencia,
    updateEducacion,
    updateHabilidades,
  };
};
