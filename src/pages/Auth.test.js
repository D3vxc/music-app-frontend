import { describe, expect, it } from 'vitest';
import { validateRegister } from './Auth';

describe('validateRegister', () => {
  it('flags every bad field', () => {
    expect(Object.keys(validateRegister({ displayName: ' ', username: 'a', email: 'x', password: '123' }))).toEqual(['displayName', 'username', 'email', 'password']);
  });
  it('accepts a valid form', () => {
    expect(validateRegister({ displayName: 'Dev', username: 'dev_m', email: 'd@e.co', password: 'password123' })).toEqual({});
  });
});
