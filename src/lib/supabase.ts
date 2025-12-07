// Mock Supabase client to prevent fetch errors
const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    })
  },
  from: (table: string) => {
    const chainable = {
      eq: (column: string, value: any) => chainable,
      order: (column: string, options?: any) => chainable,
      limit: (count: number) => chainable,
      range: (from: number, to: number) => chainable,
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null })
    };
    
    return {
      select: (columns?: string) => chainable,
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      upsert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null })
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null })
      })
    };
  },
  functions: {
    invoke: (name: string, options?: any) => Promise.resolve({ data: null, error: null })
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => Promise.resolve({ data: null, error: null }),
      list: (path?: string) => Promise.resolve({ data: [], error: null }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } })
    })
  }
};

export { mockSupabase as supabase };