import { vi } from 'vitest';

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
        getRandomValues: (arr: any) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        }
    }
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
    value: {
        userAgent: 'test-user-agent'
    }
});

// Mock fetch for IP detection
global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ ip: '127.0.0.1' })
});