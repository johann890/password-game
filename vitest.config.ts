import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Puzzle generation runs a solver; the year-long sweep needs room.
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
