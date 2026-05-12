import { signToken, verifyToken } from '../lib/auth/auth';
import Payload from '../types/Payload';

describe('Auth Utilities', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('should sign and verify a token', () => {
    const payload: Payload = {
      userId: 1,
      userName: 'testuser',
      email: 'test@example.com',
    };

    const token = signToken(payload);
    expect(token).toBeDefined();

    const verified = verifyToken(token);
    expect(verified.userId).toBe(payload.userId);
    expect(verified.userName).toBe(payload.userName);
    expect(verified.email).toBe(payload.email);
  });

  it('should throw an error for an invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });
});
