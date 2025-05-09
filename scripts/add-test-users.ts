import { db, pgPool } from '../src/config/database';
import { users } from '../src/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function addTestUsers() {
  console.log('Adding test admin users...');

  try {
    // Hash password for security
    const hashPassword = async (password: string) => {
      return bcrypt.hash(password, 10);
    };

    // Test admin users with the same password (123456)
    const adminUsers = [
      { 
        username: 'admin',
        email: 'admin@example.com',
        password: await hashPassword('123456')
      },
      { 
        username: 'admin2',
        email: 'admin2@example.com',
        password: await hashPassword('123456')
      },
      { 
        username: 'admin3',
        email: 'admin3@example.com',
        password: await hashPassword('123456')
      },
      { 
        username: 'admin4',
        email: 'admin4@example.com',
        password: await hashPassword('123456')
      }
    ];

    console.log('Inserting admin test users...');
    
    // Insert each user and handle potential duplicates
    for (const user of adminUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.username, user.username));
        
        if (existingUser.length === 0) {
          const result = await db.insert(users).values(user).returning();
          console.log(`User '${user.username}' added successfully`);
        } else {
          console.log(`User '${user.username}' already exists, skipping`);
        }
      } catch (error) {
        console.error(`Error adding user '${user.username}':`, error);
      }
    }

    console.log('Test users created successfully!');
  } catch (error) {
    console.error('Error adding test users:', error);
  } finally {
    // Close the database connection
    await pgPool.end();
  }
}

// Run the function
addTestUsers().catch(console.error); 