import React from 'react';
import { render } from '@testing-library/react-native';
import { Loading } from '../../components/ui/Loading';

describe('Loading Component', () => {
  it('renders without text', () => {
    const { toJSON } = render(<Loading />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with text', () => {
    const { getByText } = render(<Loading text="Loading..." />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, toJSON } = render(<Loading size="small" />);
    expect(toJSON()).toBeTruthy();

    rerender(<Loading size="large" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders full screen version', () => {
    const { getByText } = render(
      <Loading fullScreen text="Loading..." />
    );
    expect(getByText('Loading...')).toBeTruthy();
  });
});
