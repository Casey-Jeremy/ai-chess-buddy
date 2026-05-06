// Mock for @react-native-community/netinfo
const netInfoState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
  details: null,
};

const NetInfo = {
  fetch: jest.fn(() => Promise.resolve(netInfoState)),
  addEventListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
  useNetInfo: jest.fn(() => netInfoState),
};

export default NetInfo;
