import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../../stores/authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.clearAuth();
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.initialized).toBe(false);
  });

  it('sets user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      provider: 'email',
      provider_id: null,
      plan_type: 'free' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('sets loading correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);
  });

  it('clears auth state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      provider: 'email',
      provider_id: null,
      plan_type: 'free' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });
});
