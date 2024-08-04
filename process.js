const sql = require("mssql");
const http = require('http');
const { queryDatabase } = require('./db.js');


const getUsers = async (email_id) => {
    email_id = email_id.trim();
    const query = 'SELECT * FROM tbl_users WHERE email_id = @emailID';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: email_id }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const getClasses = async (email_id) => {
    email_id = email_id.trim();
    const query = 'SELECT * FROM tbl_classes WHERE teacher_email_id = @emailID order by class_name';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: email_id }
    ];
    const results = await queryDatabase(query, params);
    return results;
}

const getAssignments = async (email_id) => {
    email_id = email_id.trim();
    const query = 'SELECT * FROM tbl_assignments WHERE id in (Select assignment_id from tbl_user_assignment_mappings WHERE user_email_id = @emailID) order by duedate';
    const params = [
        { name: 'emailID', type: sql.VarChar, value: email_id }
    ];
    const results = await queryDatabase(query, params);
    return results;
}


const createClass = async (current_loggedin_user_email_id, class_details) => {
    let users = await getUsers(current_loggedin_user_email_id);
    if (users && users.length == 1) {
        user_type = users[0].user_type;
        teacher_id = users[0].id;

        const query = 'INSERT INTO tbl_classes (teacher_id,class_name,teacher_email_id,email_ids)' +
            'VALUES (@teacherID, @className, @teacherEmailID, @emailIDs); SELECT SCOPE_IDENTITY() AS InsertedID;';
        const params = [
            { name: 'teacherID', type: sql.Int, value: teacher_id },
            { name: 'className', type: sql.VarChar, value: class_details.class_name },
            { name: 'teacherEmailID', type: sql.VarChar, value: current_loggedin_user_email_id },
            { name: 'emailIDs', type: sql.VarChar, value: class_details.email_ids }
        ];
        const result = await queryDatabase(query, params);

        const class_id = result[0].InsertedID;
        if (user_type === 'TEACHER') {
            await create_email_id_class_mappings(current_loggedin_user_email_id, class_details, class_id);
        }
        return class_id;
    }
}

const create_email_id_class_mappings = async (current_loggedin_user_email_id, class_details, class_id) => {

    const class_emailIDs = class_details.email_ids.split(',');

    //add owner current logged in user email id
    class_emailIDs.push(current_loggedin_user_email_id);

    //make sure there are no duplicate emailIDs
    const uniqueEmailIDs = [...new Set(class_emailIDs)];

    uniqueEmailIDs.forEach(async (email_id, index) => {
        email_id = email_id.trim();
        const query = 'INSERT INTO tbl_user_class_mappings (class_id,user_email_id)' +
            'VALUES (@classID, @emailID)';
        const params = [
            { name: 'classID', type: sql.Int, value: class_id },
            { name: 'emailID', type: sql.VarChar, value: email_id }
        ];
        await queryDatabase(query, params);
    });
}

const createAssignment = async (current_loggedin_user_email_id, assignment_details) => {
    let users = await getUsers(current_loggedin_user_email_id);
    if (users && users.length == 1) {
        user_type = users[0].user_type;
        teacher_id = users[0].id;

        const query = 'INSERT INTO tbl_assignments (owner_email_id,class_name,class_id,title,details,duedate)' +
            'VALUES (@owner_email_id, @class_name, @class_id, @title,@details, @duedate); SELECT SCOPE_IDENTITY() AS InsertedID;';

        const params = [
            { name: 'owner_email_id', type: sql.VarChar, value: current_loggedin_user_email_id },
            { name: 'class_name', type: sql.VarChar, value: assignment_details.class_name },
            { name: 'class_id', type: sql.Int, value: assignment_details.class_id },
            { name: 'title', type: sql.VarChar, value: assignment_details.title },
            { name: 'details', type: sql.VarChar, value: assignment_details.details },
            { name: 'duedate', type: sql.VarChar, value: assignment_details.duedate }
        ];

        const result = await queryDatabase(query, params);
        const assignment_id = result[0].InsertedID;

        if (user_type === 'TEACHER') {
            await create_email_id_assignemnt_mappings(current_loggedin_user_email_id, assignment_details.class_id, assignment_id);

        } else if (user_type === 'STUDENT') {
            const query = 'INSERT INTO tbl_user_assignment_mappings (assignment_id,user_email_id)' +
                'VALUES (@assignment_id, @email_id)';
            const params = [
                { name: 'assignment_id', type: sql.Int, value: assignment_id },
                { name: 'email_id', type: sql.VarChar, value: current_loggedin_user_email_id }
            ];
            await queryDatabase(query, params);
        }

        return assignment_id;
    }

}

const create_email_id_assignemnt_mappings = async (current_loggedin_user_email_id, class_id, assignment_id) => {

    const query = 'select * from tbl_user_class_mappings where class_id = @classID';
    const params = [
        { name: 'classID', type: sql.Int, value: class_id }
    ];
    const results = await queryDatabase(query, params);
    results.forEach(async (result, index) => {

        if (result.user_email_id) {
            email_id = result.user_email_id.trim();
            const query = 'INSERT INTO tbl_user_assignment_mappings (assignment_id,user_email_id)' +
                'VALUES (@assignment_id, @email_id)';
            const params = [
                { name: 'assignment_id', type: sql.Int, value: assignment_id },
                { name: 'email_id', type: sql.VarChar, value: email_id }
            ];
            await queryDatabase(query, params);
        }
    })

}

const createUser = async (current_loggedin_user_email_id, user_details) => {
    if (user_details.user_type === 'TEACHER') {
        if (user_details.verification_code != '309e919e74b9') {
            return;
        }
    }
    const query = 'INSERT INTO tbl_users (email_id,user_type)' +
        'VALUES (@email_id, @user_type); SELECT SCOPE_IDENTITY() AS InsertedID;';
    const params = [
        { name: 'email_id', type: sql.VarChar, value: current_loggedin_user_email_id },
        { name: 'user_type', type: sql.VarChar, value: user_details.user_type }
    ];

    const result = await queryDatabase(query, params);
    const user_id = result[0].InsertedID;

    if (user_details.user_type === 'STUDENT') {
        const defaultClass = {}
        defaultClass.class_name = 'Miscellaneous';
        defaultClass.email_ids = current_loggedin_user_email_id;

        createClass(current_loggedin_user_email_id, defaultClass);
    }

    return user_id;
}

const deleteAssignment = async (current_loggedin_user_email_id, assignment_details) => {
    const query1 = 'delete from tbl_user_assignment_mappings where assignment_id = @assignmentID';
    const params1 = [
        { name: 'assignmentID', type: sql.Int, value: assignment_details.assignment_id }
    ];
    const result1 = await queryDatabase(query1, params1);

    const query2 = 'delete from tbl_assignments where id = @assignmentID';
    const params2 = [
        { name: 'assignmentID', type: sql.Int, value: assignment_details.assignment_id }
    ];
    const result2 = await queryDatabase(query2, params2);

    return;
}

const deleteClass = async (current_loggedin_user_email_id, class_details) => {

    const query1 = 'delete from tbl_user_class_mappings where class_id = @classID';
    const params1 = [
        { name: 'classID', type: sql.Int, value: class_details.class_id }
    ];
    const result1 = await queryDatabase(query1, params1);

    const query2 = 'delete from tbl_classes where id = @classID';
    const params2 = [
        { name: 'classID', type: sql.Int, value: class_details.class_id }
    ];
    const result2 = await queryDatabase(query2, params2);

    return;
}

const deleteAllData = async () => {
    const query1 = 'delete from tbl_user_class_mappings';
    const params1 = [];
    const result1 = await queryDatabase(query1, params1);

    const query2 = 'delete from tbl_classes';
    const params2 = [];
    const result2 = await queryDatabase(query2, params2);

    const query3 = 'delete from tbl_user_assignment_mappings';
    const params3 = [];
    const result3 = await queryDatabase(query3, params3);

    const query4 = 'delete from tbl_assignments';
    const params4 = [];
    const result4 = await queryDatabase(query4, params4);

    const query5 = 'delete from tbl_users';
    const params5 = [];
    const result5 = await queryDatabase(query5, params5);

    return "SUCCESS";
}



module.exports = {
    getUsers, getClasses, getAssignments, createClass, createAssignment,
    createUser, deleteAssignment, deleteClass, deleteAllData
};
