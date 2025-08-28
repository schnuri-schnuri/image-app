import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Erweitere die Vitest-Erwartungen mit Testing Library Matchers
expect.extend(matchers);

// Nach jedem Test aufräumen
afterEach(() => {
  cleanup();
});
