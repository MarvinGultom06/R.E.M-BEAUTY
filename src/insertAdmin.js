// insertAdmin.js
const Admin = require('./models/Admin');
const bcrypt = require('bcrypt');

const adminCredentials = [
    { username: "Marvin", password: "marvin" },
    { username: "Kent", password: "marvin" }
];

const insertAdminData = async () => {
    try {
        await Admin.deleteMany({});
        for (const admin of adminCredentials) {
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            const newAdmin = new Admin({ username: admin.username, password: hashedPassword });
            await newAdmin.save();
        }
        console.log('Admin data inserted successfully');
    } catch (error) {
        console.error('Error inserting admin data:', error);
    }
};

module.exports = insertAdminData;
