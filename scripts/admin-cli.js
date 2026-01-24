#!/usr/bin/env node

const userManagement = require('../server/admin/userManagement');

// Command line interface for admin operations
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    try {
        switch (command) {
            case 'create-user':
                await createUser();
                break;
            case 'delete-user':
                await deleteUser();
                break;
            case 'list-users':
                await listUsers();
                break;
            case 'set-role':
                await setUserRole();
                break;
            case 'stats':
                await getUserStats();
                break;
            case 'export-data':
                await exportUserData();
                break;
            default:
                showHelp();
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function createUser() {
    const email = args[1];
    const password = args[2];
    const displayName = args[3];
    const role = args[4] || 'user';

    if (!email || !password) {
        console.error('Usage: node admin-cli.js create-user <email> <password> [displayName] [role]');
        return;
    }

    const user = await userManagement.createUser({
        email,
        password,
        displayName,
        role
    });

    console.log('User created successfully:');
    console.log(`UID: ${user.uid}`);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName}`);
}

async function deleteUser() {
    const uid = args[1];

    if (!uid) {
        console.error('Usage: node admin-cli.js delete-user <uid>');
        return;
    }

    const result = await userManagement.deleteUser(uid);
    console.log('User deleted successfully:', result);
}

async function listUsers() {
    const maxResults = parseInt(args[1]) || 100;
    const result = await userManagement.listUsers(maxResults);

    console.log(`Found ${result.users.length} users:`);
    result.users.forEach(user => {
        console.log(`- ${user.email} (${user.uid}) - Role: ${user.firestoreData?.role || 'N/A'}`);
    });
}

async function setUserRole() {
    const uid = args[1];
    const role = args[2];

    if (!uid || !role) {
        console.error('Usage: node admin-cli.js set-role <uid> <role>');
        return;
    }

    const result = await userManagement.setUserRole(uid, role);
    console.log('Role updated successfully:', result);
}

async function getUserStats() {
    const stats = await userManagement.getUserStatistics();
    console.log('User Statistics:');
    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`Active Users: ${stats.activeUsers}`);
    console.log(`Total Children: ${stats.totalChildren}`);
    console.log('Users by Role:', stats.usersByRole);
}

async function exportUserData() {
    const uid = args[1];

    if (!uid) {
        console.error('Usage: node admin-cli.js export-data <uid>');
        return;
    }

    const userData = await userManagement.exportUserData(uid);
    console.log('User Data Export:');
    console.log(JSON.stringify(userData, null, 2));
}

function showHelp() {
    console.log('PANDAS Tracker Admin CLI');
    console.log('');
    console.log('Commands:');
    console.log('  create-user <email> <password> [displayName] [role]  - Create a new user');
    console.log('  delete-user <uid>                                    - Delete a user');
    console.log('  list-users [maxResults]                              - List all users');
    console.log('  set-role <uid> <role>                                - Set user role');
    console.log('  stats                                                - Show user statistics');
    console.log('  export-data <uid>                                    - Export user data');
    console.log('');
    console.log('Examples:');
    console.log('  node admin-cli.js create-user admin@example.com password123 "Admin User" admin');
    console.log('  node admin-cli.js list-users 50');
    console.log('  node admin-cli.js set-role abc123 moderator');
    console.log('  node admin-cli.js stats');
}

if (require.main === module) {
    main();
}

module.exports = { main };