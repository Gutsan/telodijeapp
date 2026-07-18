import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';

describe('EmptyState Component', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <EmptyState title="No data found" />
    );
    expect(getByText('No data found')).toBeTruthy();
  });

  it('renders description when provided', () => {
    const { getByText } = render(
      <EmptyState 
        title="No data" 
        description="There is no data to display" 
      />
    );
    expect(getByText('There is no data to display')).toBeTruthy();
  });

  it('renders action when provided', () => {
    const { getByText } = render(
      <EmptyState 
        title="No data" 
        action={<Text>Click me</Text>}
      />
    );
    expect(getByText('Click me')).toBeTruthy();
  });

  it('renders with custom icon', () => {
    const { getByText } = render(
      <EmptyState 
        title="No results" 
        icon="🔍"
      />
    );
    expect(getByText('🔍')).toBeTruthy();
  });
});
