// SPDX-License-Identifier: MIT
// Testing Library keeps what it rendered in the document; without this, one test's shell would still
// be mounted while the next one queries for its own.
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
