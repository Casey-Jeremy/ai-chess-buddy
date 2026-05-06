// Mock for @expo/vector-icons
const React = require('react');

const createIconComponent = (name) => {
  return (props) => {
    const MockIcon = require('react-native').Text;
    return React.createElement(MockIcon, { testID: `icon-${name}`, ...props }, name);
  };
};

module.exports = {
  Ionicons: createIconComponent('Ionicons'),
  MaterialIcons: createIconComponent('MaterialIcons'),
  FontAwesome: createIconComponent('FontAwesome'),
  MaterialCommunityIcons: createIconComponent('MaterialCommunityIcons'),
};
