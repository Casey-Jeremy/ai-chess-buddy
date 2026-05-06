// Mock React Native for Jest
const React = require('react');

const View = 'View';
const Text = 'Text';
const TouchableOpacity = 'TouchableOpacity';
const ScrollView = 'ScrollView';
const FlatList = 'FlatList';
const ActivityIndicator = 'ActivityIndicator';
const RefreshControl = 'RefreshControl';
const TextInput = 'TextInput';
const Image = 'Image';

module.exports = {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style || {},
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};
