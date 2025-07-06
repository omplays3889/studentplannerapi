require('dotenv').config();
const sql = require("mssql");
const http = require('http');
const jwt = require('jsonwebtoken');
const { queryDatabase } = require('./db.js');
const queries = require('./dbqueries');

const SECRET_KEY = process.env.JWT_UNSUBSCRIBE_TOKEN_KEY;

function decodeUnsubscribeToken(token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      return { email: decoded.email };
    } catch (err) {
      if (err.name === 'TokenExpiredError') return { error: 'expired' };
      return { error: 'invalid' };
    }
  }

const unsubscribe = async (token) => {
    const result = decodeUnsubscribeToken(token);

    if (result.error === 'expired') {
        return 'Token has expired.';
    } else if (result.error === 'invalid') {
        return 'Invalid token.';
    }

    let email_id = result.email;
    email_id = email_id.trim();
    const queryDelete = queries.unsubscribe_query;
    const params = [email_id];
    await queryDatabase(queryDelete, params);
    return 'You have unsubscribed successfully.';
}

const getUsers = async (email_id) => {
    email_id = email_id.trim();
    const query = queries.get_users_query;
    const params = [email_id];
    const results = await queryDatabase(query, params);
    return results;
}

const getGroups = async (email_id) => {
    email_id = email_id.trim();
    const query = queries.get_groups_query;
    const params = [email_id];
    const results = await queryDatabase(query, params);
    return results;
}

const getAssignments = async (email_id) => {
    email_id = email_id.trim();
    const query = queries.get_assignments_query;
    const params = [email_id];
    const results = await queryDatabase(query, params);
    return results;
}


const createGroup = async (current_loggedin_user_email_id, group_details) => {
    let users = await getUsers(current_loggedin_user_email_id);
    if (users && users.length == 1) {
        user_type = users[0].user_type;
        teacher_id = users[0].id;

        const query = queries.create_group_query;
        const params = [teacher_id, group_details.group_name, current_loggedin_user_email_id, group_details.email_ids]
        const result = await queryDatabase(query, params);

        const group_id = result[0].InsertedID;
        if (user_type === 'TEACHER') {
            await create_email_id_group_mappings(current_loggedin_user_email_id, group_details, group_id);
        }
        return group_id;
    }
}

const create_email_id_group_mappings = async (current_loggedin_user_email_id, group_details, group_id) => {

    const group_emailIDs = group_details.email_ids.split(',');

    //add owner current logged in user email id
    group_emailIDs.push(current_loggedin_user_email_id);

    //make sure there are no duplicate emailIDs
    const uniqueEmailIDs = [...new Set(group_emailIDs)];

    uniqueEmailIDs.forEach(async (email_id, index) => {
        email_id = email_id.trim();
        const query = queries.create_email_id_group_mapping_query;
        const params = [group_id, email_id];
        await queryDatabase(query, params);
    });
}

const createAssignment = async (current_loggedin_user_email_id, assignment_details) => {
    let users = await getUsers(current_loggedin_user_email_id);
    if (users && users.length == 1) {
        user_type = users[0].user_type;
        teacher_id = users[0].id;

        const query = queries.create_assignemnt_query;

        const params = [current_loggedin_user_email_id, assignment_details.group_name, assignment_details.group_id,
            assignment_details.title, assignment_details.details, assignment_details.duedate];

        const result = await queryDatabase(query, params);
        const assignment_id = result[0].InsertedID;

        if (user_type === 'TEACHER') {
            await create_email_id_assignemnt_mappings(current_loggedin_user_email_id, assignment_details.group_id, assignment_id);

        }

        return assignment_id;
    }

}

const create_email_id_assignemnt_mappings = async (current_loggedin_user_email_id, group_id, assignment_id) => {

    const query = queries.get_all_user_group_mapping_query;
    const params = [group_id];
    const results = await queryDatabase(query, params);
    results.forEach(async (result, index) => {

        if (result.user_email_id) {
            email_id = result.user_email_id.trim();
            const query = queries.insert_user_assignment_mapping_query;
            const params = [assignment_id, email_id];
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
    const query = queries.create_user_query;
    const params = [current_loggedin_user_email_id, user_details.user_type];

    const result = await queryDatabase(query, params);
    const user_id = result[0].InsertedID;

    const defaultgroup = {}
    defaultgroup.group_name = 'Independent';
    defaultgroup.email_ids = current_loggedin_user_email_id;

    createGroup(current_loggedin_user_email_id, defaultgroup);

    return user_id;
}

const deleteAssignment = async (current_loggedin_user_email_id, assignment_details) => {
    const query1 = queries.delete_user_assignment_mapping_query;
    const params1 = [assignment_details.assignment_id];
    const result1 = await queryDatabase(query1, params1);

    const query2 = queries.delete_assignment_query;
    const params2 = [assignment_details.assignment_id];
    const result2 = await queryDatabase(query2, params2);

    return;
}

const deleteGroup = async (group_details) => {

    const query1 = queries.delete_user_group_mapping_query;
    const params1 = [group_details.group_id];
    await queryDatabase(query1, params1);

    const query2 = queries.delete_group_query;
    const params2 = [group_details.group_id];
    await queryDatabase(query2, params2);

    const query3 = queries.delete_assignments_from_group_query;
    await queryDatabase(query3, params2);

    const query4 = queries.delete_notinuse_user_assignment_mapping_query;
    await queryDatabase(query4, null);

    return;
}

const deleteAllData = async () => {
    const query1 = 'delete from tbl_user_group_mappings';
    const params1 = [];
    const result1 = await queryDatabase(query1, params1);

    const query2 = 'delete from tbl_groups';
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
    unsubscribe, getUsers, getGroups, getAssignments, createGroup, createAssignment,
    createUser, deleteAssignment, deleteGroup, deleteAllData
};
