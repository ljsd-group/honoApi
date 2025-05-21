# Database Migrations with Drizzle

This project uses Drizzle ORM for database schema management and migrations.

## Configuration

The database schema is defined in `src/db/schema.ts`, and Drizzle is configured in `drizzle.config.ts`.

## Setup

1. Make sure you have a `.env` file with your PostgreSQL connection string:

```
DATABASE_URL=postgres://username:password@hostname:port/database
```

2. Install dependencies:

```bash
npm install
```

## Database Management Commands

### Generate Migration Files

To generate SQL migration files based on changes to your schema:

```bash
npm run generate
```

This will analyze the differences between your schema and the database, then create migration files in the `migrations` directory.

### Apply Migrations

To push schema changes directly to your database:

```bash
npm run migrate
```

This command applies the changes defined in your schema directly to the database without requiring SQL files.

## Modifying the Schema

When you need to update your database schema:

1. Edit the schema file in `src/db/schema.ts`
2. Run `npm run generate` to create migration files
3. Run `npm run migrate` to apply the changes to your database

## Database Connection

The database connection is configured in `src/db/index.ts`. This exports a `db` object that you can use to interact with your database: 