import test from 'node:test';
import assert from 'node:assert/strict';
import { employerBoard } from './discovery.mjs';
test('employer-linked ATS discovery scopes the exact tenant and rejects impostor domains',()=>{const s=employerBoard('https://boards.greenhouse.io/embed/job_board/js?for=example','https://example.com/careers','company',1);assert.equal(s.tenant,'example');assert.deepEqual(s.config.allowedPaths,['/example/']);assert.equal(s.ownershipEvidenceUrl,'https://example.com/careers');assert.equal(employerBoard('https://jobs.ashbyhq.com.evil.test/example','https://example.com/careers','company'),null);assert.equal(employerBoard('https://linkedin.com/jobs','https://example.com/careers','company'),null)});
