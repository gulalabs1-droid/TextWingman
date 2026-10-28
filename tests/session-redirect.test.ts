import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextResponse } from 'next/server';
import { sessionRedirect } from '../lib/session-redirect';

test('session redirect keeps safe query parameters and refreshed cookies', () => {
  const session = NextResponse.next();
  session.cookies.set('session-token', 'refreshed', { httpOnly: true, secure: true, path: '/' });
  const response = sessionRedirect('https://wingman.example/login', '/pricing?plan=monthly&trial=1', session);
  assert.equal(response.headers.get('location'), 'https://wingman.example/pricing?plan=monthly&trial=1');
  assert.equal(response.cookies.get('session-token')?.value, 'refreshed');
  assert.match(response.headers.get('set-cookie') || '', /HttpOnly/);
  assert.match(response.headers.get('set-cookie') || '', /Secure/);
});

test('session redirect rejects external return paths', () => {
  const response = sessionRedirect('https://wingman.example/login', '//attacker.example/', NextResponse.next());
  assert.equal(response.headers.get('location'), 'https://wingman.example/dashboard');
});
