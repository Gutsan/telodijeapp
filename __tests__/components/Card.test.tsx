import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../components/ui/Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Card onPress={mockOnPress}>
        <Text>Pressable Card</Text>
      </Card>
    );
    fireEvent.press(getByText('Pressable Card'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders without onPress as View', () => {
    const { getByText } = render(
      <Card>
        <Text>Non-pressable Card</Text>
      </Card>
    );
    expect(getByText('Non-pressable Card')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender, getByText } = render(
      <Card variant="default">
        <Text>Default Card</Text>
      </Card>
    );
    expect(getByText('Default Card')).toBeTruthy();

    rerender(
      <Card variant="outlined">
        <Text>Outlined Card</Text>
      </Card>
    );
    expect(getByText('Outlined Card')).toBeTruthy();

    rerender(
      <Card variant="elevated">
        <Text>Elevated Card</Text>
      </Card>
    );
    expect(getByText('Elevated Card')).toBeTruthy();
  });
});
