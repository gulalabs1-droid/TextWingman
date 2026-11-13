import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arrivalGreeting,
  firstNameOf,
  isOnboardingContext,
  onboardingDestination,
  parseArrival,
  parseStartIntent,
} from '../lib/first-run';

test('onboarding sends people to an invite or saved reply before their first-action choice', () => {
  assert.equal(onboardingDestination({ pendingInviteCode: 'friendsv2', hasPendingThread: true, start: 'paste' }), '/invite/FRIENDSV2');
  assert.equal(onboardingDestination({ hasPendingThread: true, start: 'screenshot' }), '/app?restore=1');
  assert.equal(onboardingDestination({ hasPendingThread: false, start: 'screenshot' }), '/app?start=screenshot');
  assert.equal(onboardingDestination({ hasPendingThread: false, start: null }), '/app');
});

test('onboarding ignores invite codes that are not plain codes', () => {
  assert.equal(onboardingDestination({ pendingInviteCode: '../admin', hasPendingThread: false, start: null }), '/app');
  assert.equal(onboardingDestination({ pendingInviteCode: 42, hasPendingThread: false, start: 'paste' }), '/app?start=paste');
});

test('only known start intents, arrivals, and contexts are accepted', () => {
  assert.equal(parseStartIntent('screenshot'), 'screenshot');
  assert.equal(parseStartIntent('admin'), null);
  assert.equal(parseStartIntent(null), null);
  assert.equal(parseArrival('new'), 'new');
  assert.equal(parseArrival('1'), null);
  assert.equal(isOnboardingContext('new_match'), true);
  assert.equal(isOnboardingContext('boss'), false);
});

test('first name is taken from the saved full name', () => {
  assert.equal(firstNameOf('  Sam   Rivera '), 'Sam');
  assert.equal(firstNameOf('   '), null);
  assert.equal(firstNameOf(null), null);
});

test('arrival greeting reflects who arrived and what they can use', () => {
  assert.deepEqual(arrivalGreeting({ arrival: 'new', fullName: 'Sam Rivera', isPro: false, remaining: 3, limit: 3 }), {
    title: "You're in, Sam.",
    description: 'You have 3 free replies in your 24-hour window. Drop a screenshot or paste a message to start.',
  });
  assert.deepEqual(arrivalGreeting({ arrival: 'returning', fullName: null, isPro: false, remaining: 1, limit: 3 }), {
    title: 'Welcome back.',
    description: 'You have 1 free reply in your 24-hour window.',
  });
  assert.equal(arrivalGreeting({ arrival: 'returning', fullName: 'Sam', isPro: true, remaining: 0, limit: 3 }).description, 'Unlimited replies are on.');
  assert.match(arrivalGreeting({ arrival: 'returning', fullName: 'Sam', isPro: false, remaining: 0, limit: 3 }).description, /used your 3 free replies/);
});
