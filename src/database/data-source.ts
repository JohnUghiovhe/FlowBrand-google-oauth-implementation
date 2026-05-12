import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { UserSession } from 'src/modules/auth/entities/user-session.entity';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'flowbrand',
  entities: [User, UserSession],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
