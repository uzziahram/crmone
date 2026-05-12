import database from '../lib/database/db';

describe('Database Connection', () => {
  it('should be defined', () => {
    expect(database).toBeDefined();
  });

  it('should have correct configuration from env', () => {
    // Note: This test verifies that the pool is created with the expected params
    // pool.config is where mysql2 stores its configuration
    const config: any = (database as any).pool.config;
    
    expect(config.connectionConfig.host).toBe(process.env.DB_HOST || 'localhost');
    expect(config.connectionConfig.user).toBe(process.env.DB_USER || 'root');
    expect(config.connectionConfig.database).toBe(process.env.DB_NAME || 'crmone');
    expect(config.connectionConfig.port).toBe(process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307);
  });
});
