// Mock @tanstack/react-query for Jest
const mockQueryClient = {
  clear: jest.fn(),
  cancelQueries: jest.fn(),
  invalidateQueries: jest.fn(),
  refetchQueries: jest.fn(),
};

module.exports = {
  QueryClient: jest.fn().mockImplementation(() => mockQueryClient),
  QueryClientProvider: ({ children }) => children,
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useQueryClient: jest.fn(() => mockQueryClient),
};
