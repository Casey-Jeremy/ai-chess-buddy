const React = require('react');
const { View } = require('react-native');

const passthrough = (value) => value;

const Animated = {
  View,
  createAnimatedComponent: (Component) => Component,
};

module.exports = {
  __esModule: true,
  default: Animated,
  Easing: {
    ease: passthrough,
    inOut: passthrough,
  },
  useSharedValue: (value) => ({ value }),
  useAnimatedStyle: (updater) => (typeof updater === 'function' ? updater() : {}),
  withRepeat: passthrough,
  withSequence: (...values) => values[values.length - 1],
  withTiming: passthrough,
};
