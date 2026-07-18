import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/ui/Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter email" value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" value="" onChangeText={mockOnChange} />
    );
    fireEvent.changeText(getByPlaceholderText('Type here'), 'test');
    expect(mockOnChange).toHaveBeenCalledWith('test');
  });

  it('displays error message', () => {
    const { getByText } = render(
      <Input value="" onChangeText={() => {}} error="This field is required" />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('renders with left icon', () => {
    const { getByText } = render(
      <Input 
        value="" 
        onChangeText={() => {}} 
        leftIcon={<Text>📧</Text>}
      />
    );
    expect(getByText('📧')).toBeTruthy();
  });

  it('can be disabled', () => {
    const mockOnChange = jest.fn();
    const { getByDisplayValue } = render(
      <Input 
        value="test" 
        onChangeText={mockOnChange} 
        disabled
      />
    );
    const input = getByDisplayValue('test');
    fireEvent.changeText(input, 'new value');
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
