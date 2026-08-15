import * as Crypto from 'expo-crypto';

/**
 * Client-generated UUIDs.
 *
 * Rows are given their id on the device before they are sent, which is what
 * makes the set-logging mutations idempotent: a retry after a dropped
 * connection re-sends the same primary key and upserts instead of inserting a
 * duplicate. Without this, a flaky gym connection produces phantom sets.
 */
export function newId(): string {
  return Crypto.randomUUID();
}
