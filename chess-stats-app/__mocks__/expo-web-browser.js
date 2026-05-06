module.exports = {
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({
    type: 'success',
    url: 'chessstats://auth/callback',
  })),
};
