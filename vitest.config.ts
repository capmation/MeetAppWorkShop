import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    env: { TZ: 'UTC' },
    include: [
      'tests/unit/**/*.test.ts',
      'tests/components/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'app/**/*.ts',
        'app/**/*.vue',
        'server/**/*.ts',
      ],
      exclude: [
        'app/types/**',
        '**/*.d.ts',
        // Socket.io plugin requires a running server; excluded from unit coverage
        'server/plugins/socket.io.ts',
      ],
    },
  },
})
