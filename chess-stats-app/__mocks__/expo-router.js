// Mock expo-router for Jest
module.exports = {
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  useSegments: () => [],
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: {
    Screen: 'StackScreen',
  },
  Tabs: ({ children }) => children,
};
