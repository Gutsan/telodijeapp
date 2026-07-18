import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../components/ui/Badge';

describe('Badge Component', () => {
  it('renders correctly with label', () => {
    const { getByText } = render(<Badge label="Test Badge" />);
    expect(getByText('Test Badge')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender, getByText } = render(
      <Badge label="Default" variant="default" />
    );
    expect(getByText('Default')).toBeTruthy();

    rerender(<Badge label="Primary" variant="primary" />);
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Badge label="Success" variant="success" />);
    expect(getByText('Success')).toBeTruthy();

    rerender(<Badge label="Warning" variant="warning" />);
    expect(getByText('Warning')).toBeTruthy();

    rerender(<Badge label="Error" variant="error" />);
    expect(getByText('Error')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, getByText } = render(
      <Badge label="Small" size="sm" />
    );
    expect(getByText('Small')).toBeTruthy();

    rerender(<Badge label="Medium" size="md" />);
    expect(getByText('Medium')).toBeTruthy();

    rerender(<Badge label="Large" size="lg" />);
    expect(getByText('Large')).toBeTruthy();
  });
});
