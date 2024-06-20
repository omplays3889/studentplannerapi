const sql = require("mssql");
const http = require('http');
const { queryDatabase } = require('./db.js');


  const getUsers = async (email_id) => {
    const query = 'SELECT * FROM tbl_users WHERE email_id = @emailID';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: email_id }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const getClasses = async (email_id) => {
    const query = 'SELECT * FROM tbl_classes WHERE teacher_email_id = @emailID';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: email_id }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const getAssignments = async (email_id) => {
    const query = 'SELECT * FROM tbl_assignments WHERE id in (Select assignment_id from tbl_user_assignment_mappings WHERE user_email_id = @emailID)';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: email_id }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const createClass = async (email_id, class_details) => {
    let users = await getUsers(email_id);
    if(users && users.length == 1) {
        user_email_id = users[0].email_id;
        user_type = users[0].user_type;
        teacher_id = users[0].id;
        class_name = class_details.class_name;
        email_ids = class_details.students_email_ids;

        const query = 'INSERT INTO tbl_classes (teacher_id,class_name,teacher_email_id,email_ids)'+
        'VALUES (@teacherID, @className, @teacherEmailID, @emailIDs); SELECT SCOPE_IDENTITY() AS InsertedID;';
        const params = [
            { name: 'teacherID', type: sql.Int, value: teacher_id },
            { name: 'className', type: sql.VarChar, value: class_name },
            { name: 'teacherEmailID', type: sql.VarChar, value: user_email_id },
            { name: 'emailIDs', type: sql.VarChar, value: email_ids }
        ];
        const result =  await queryDatabase(query, params);

        const class_id = result[0].InsertedID;
        if(user_type === 'TEACHER') {
            const enrolled_user_email_ids = email_ids.split(',');
            enrolled_user_email_ids.push(user_email_id);
            const uniqueEmailIds = [...new Set(enrolled_user_email_ids)];
            uniqueEmailIds.forEach( async (email_id, index) => {
                const query = 'INSERT INTO tbl_user_class_mappings (class_id,user_email_id)'+
                'VALUES (@classID, @userEmailID)';
                const params = [
                    { name: 'classID', type: sql.Int, value: class_id },
                    { name: 'userEmailID', type: sql.VarChar, value: email_id }
                ];
                await queryDatabase(query, params);
                });
        } else {
            const query = 'INSERT INTO tbl_user_class_mappings (class_id,user_email_id)'+
                'VALUES (@classID, @userEmailID)';
            const params = [
                { name: 'classID', type: sql.Int, value: class_id },
                { name: 'userEmailID', type: sql.VarChar, value: user_email_id }
            ];
            await queryDatabase(query, params);
        }
    }
}

module.exports = {
    getUsers, getClasses, getAssignments, createClass
};
