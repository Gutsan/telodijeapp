import React from 'react';
import { render } from '@testing-library/react-native';
import { Avatar } from '../../components/ui/Avatar';

describe('Avatar Component', () => {
  it('renders initials when no image', () => {
    const { getByText } = render(<Avatar name="Juan Pérez" />);
    expect(getByText('JP')).toBeTruthy();
  });

  it('renders single initial for single name', () => {
    const { getByText } = render(<Avatar name="Juan" />);
    expect(getByText('J')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, getByText } = render(
      <Avatar name="Test" size="sm" />
    );
    expect(getByText('T')).toBeTruthy();

    rerender(<Avatar name="Test" size="md" />);
    expect(getByText('T')).toBeTruthy();

    rerender(<Avatar name="Test" size="lg" />);
    expect(getByText('T')).toBeTruthy();

    rerender(<Avatar name="Test" size="xl" />);
    expect(getByText('T')).toBeTruthy();
  });

  it('renders with image uri', () => {
    const { toJSON } = render(
      <Avatar 
        name="Test" 
        uri="https://example.com/avatar.jpg" 
      />
    );
    // Image component should be rendered
    expect(toJSON()).toBeTruthy();
  });

  it('handles empty name gracefully', () => {
    const { toJSON } = render(<Avatar name="" />);
    expect(toJSON()).toBeTruthy();
  });
});
