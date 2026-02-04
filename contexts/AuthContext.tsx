import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { api, User } from '@/services/api';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, passcode }: { username: string; passcode: string }) =>
      api.login(username, passcode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const pingMutation = useMutation({
    mutationFn: () => api.ping(),
  });

  const user: User | null = meQuery.data?.user ?? null;
  const isLoggedIn = !!user;
  const isLoading = meQuery.isLoading;

  return {
    user,
    isLoggedIn,
    isLoading,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    logout: logoutMutation.mutateAsync,
    logoutLoading: logoutMutation.isPending,
    ping: pingMutation.mutateAsync,
    pingLoading: pingMutation.isPending,
    refetchMe: meQuery.refetch,
  };
});
