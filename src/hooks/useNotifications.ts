import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useNotifications = (userId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data } = await api.get(`/notificaciones/usuario/${userId}`);
      return data;
    },
    enabled: !!userId,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notificaciones/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const unreadCount = query.data?.filter((n: any) => !n.leido).length || 0;

  return {
    ...query,
    markAsRead,
    unreadCount,
  };
};
