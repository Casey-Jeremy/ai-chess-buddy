import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner Property-Based Tests', () => {
  describe('Property 14: Loading states display indicators', () => {
    /**
     * **Feature: chess-stats-app, Property 14: Loading states display indicators**
     * **Validates: Requirements 8.3**
     * 
     * For any data loading operation, a loading indicator (spinner or skeleton screen) should be visible during the loading period.
     */
    it('should display ActivityIndicator for any loading message', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: undefined }),
          fc.constantFrom('small', 'large'),
          (message, size) => {
            // Render LoadingSpinner with random message and size
            const { UNSAFE_getByType, queryByText } = render(
              <LoadingSpinner message={message} size={size} />
            );

            // Verify ActivityIndicator is present (this is the loading indicator)
            const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
            expect(activityIndicator).toBeTruthy();

            // Verify the message is displayed if provided
            if (message) {
              const messageElement = queryByText(message);
              expect(messageElement).toBeTruthy();
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always display loading indicator regardless of message content', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(undefined),
            fc.constant(''),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.constant('Loading...'),
            fc.constant('Fetching data...'),
            fc.constant('Please wait...')
          ),
          (message) => {
            // Render LoadingSpinner with various message types
            const { UNSAFE_getByType } = render(
              <LoadingSpinner message={message} />
            );

            // The critical property: ActivityIndicator must always be present
            const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
            expect(activityIndicator).toBeTruthy();
            expect(activityIndicator.props.size).toBe('large'); // Default size

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display loading indicator with correct size prop', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('small', 'large'),
          (size) => {
            // Render LoadingSpinner with different sizes
            const { UNSAFE_getByType } = render(
              <LoadingSpinner size={size} />
            );

            // Verify ActivityIndicator has the correct size
            const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
            expect(activityIndicator).toBeTruthy();
            expect(activityIndicator.props.size).toBe(size);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
