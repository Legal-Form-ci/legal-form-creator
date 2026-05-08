import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock Supabase client globally for tests
import { vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
  };
  return {
    supabase: {
      from: vi.fn(() => chain),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user", email: "test@test.com" } }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: { path: "x" }, error: null }),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://x/avatar.png" } })),
        })),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { success: 1, total: 1 }, error: null }),
      },
    },
  };
});
