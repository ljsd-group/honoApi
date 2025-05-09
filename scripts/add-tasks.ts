import { db, pgPool } from '../src/config/database';
import { tasks } from '../src/db/schema';

async function addTasks() {
  console.log('Adding realistic tasks...');

  try {
    // More realistic task examples with varied statuses
    const taskList = [
      {
        title: 'API Documentation',
        description: 'Create comprehensive Swagger documentation for all API endpoints',
        status: 'in-progress'
      },
      {
        title: 'User Authentication Flow',
        description: 'Implement secure JWT-based authentication with refresh tokens',
        status: 'completed'
      },
      {
        title: 'Database Backup System',
        description: 'Set up automated daily backups for PostgreSQL database',
        status: 'pending'
      },
      {
        title: 'Frontend Integration',
        description: 'Connect React frontend with API endpoints',
        status: 'in-progress'
      },
      {
        title: 'Security Audit',
        description: 'Perform full security audit of API and database',
        status: 'pending'
      },
      {
        title: 'Implement Rate Limiting',
        description: 'Add rate limiting to prevent API abuse',
        status: 'completed'
      },
      {
        title: 'Error Handling Improvements',
        description: 'Standardize error responses across all endpoints',
        status: 'in-progress'
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize database queries and API response times',
        status: 'pending'
      },
      {
        title: 'User Management Dashboard',
        description: 'Create admin interface for user management',
        status: 'pending'
      },
      {
        title: 'Implement Pagination',
        description: 'Add pagination to list endpoints to improve performance',
        status: 'completed'
      }
    ];

    console.log('Inserting tasks...');
    const result = await db.insert(tasks).values(taskList).returning();
    console.log(`${result.length} tasks added successfully`);

    console.log('Tasks created successfully!');
  } catch (error) {
    console.error('Error adding tasks:', error);
  } finally {
    // Close the database connection
    await pgPool.end();
  }
}

// Run the function
addTasks().catch(console.error); 