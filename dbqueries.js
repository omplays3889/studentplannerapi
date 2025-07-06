 const unsubscribe_query = 'DELETE FROM tbl_user_assignment_mappings WHERE user_email_id = $1;';
 const get_users_query = 'SELECT * FROM tbl_users WHERE email_id = $1;';
 const get_groups_query = 'SELECT * FROM tbl_groups WHERE id IN ( SELECT group_id FROM tbl_user_group_mappings WHERE user_email_id = $1 ) ORDER BY group_name;';
 const get_assignments_query = 'SELECT * FROM tbl_assignments WHERE id IN ( SELECT assignment_id FROM tbl_user_assignment_mappings WHERE user_email_id = $1) ORDER BY duedate;';
 const create_group_query = 'INSERT INTO tbl_groups (teacher_id, group_name, teacher_email_id, email_ids) VALUES ($1, $2, $3, $4) RETURNING id AS "InsertedID";';
 const create_email_id_group_mapping_query = 'INSERT INTO tbl_user_group_mappings (group_id, user_email_id) VALUES ($1, $2);';

 const create_assignemnt_query = 'INSERT INTO tbl_assignments (owner_email_id, group_name, group_id, title, details, duedate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id AS "InsertedID";';
 const get_all_user_group_mapping_query = 'SELECT * FROM tbl_user_group_mappings WHERE group_id = $1;';
 const insert_user_assignment_mapping_query = 'INSERT INTO tbl_user_assignment_mappings (assignment_id, user_email_id) VALUES ($1, $2);';
 const create_user_query = 'INSERT INTO tbl_users (email_id, user_type) VALUES ($1, $2) RETURNING id AS "InsertedID";';

 const delete_user_assignment_mapping_query = 'DELETE FROM tbl_user_assignment_mappings WHERE assignment_id = $1;';
 const delete_assignment_query = 'DELETE FROM tbl_assignments WHERE id = $1;';
 const delete_user_group_mapping_query = 'DELETE FROM tbl_user_group_mappings WHERE group_id = $1;';
 const delete_group_query = 'DELETE FROM tbl_groups WHERE id = $1;';
 const delete_assignments_from_group_query = 'DELETE FROM tbl_assignments WHERE group_id = $1;';
 const delete_notinuse_user_assignment_mapping_query = 'DELETE FROM tbl_user_assignment_mappings WHERE assignment_id NOT IN (SELECT id FROM tbl_assignments GROUP BY id ORDER BY id LIMIT 1200);';

 const cleanup_delete_past_due_5_days_assignments = "DELETE FROM tbl_assignments WHERE duedate::timestamp < NOW() - INTERVAL '5 days';";
 const cleanup_delete_assignments_without_groups = 'DELETE FROM tbl_assignments WHERE group_id NOT IN ( SELECT id FROM tbl_groups GROUP BY id ORDER BY id LIMIT 1200);';
 const cleanup_delete_user_assignment_query = 'DELETE FROM tbl_user_assignment_mappings WHERE assignment_id NOT IN (SELECT id FROM tbl_assignments GROUP BY id ORDER BY id LIMIT 1200);';
 const reminders_get_user_email_ids = 'SELECT DISTINCT user_email_id FROM tbl_user_assignment_mappings LIMIT 12000;';
 const reminders_get_assignments_query = 'SELECT * FROM tbl_assignments WHERE id IN (SELECT DISTINCT assignment_id FROM tbl_user_assignment_mappings WHERE user_email_id = $1 LIMIT 100) ORDER BY duedate;';

 module.exports = {
    unsubscribe_query,
    get_users_query,
    get_groups_query,
    get_assignments_query,
    create_group_query,
    create_email_id_group_mapping_query,
    create_assignemnt_query,
    get_all_user_group_mapping_query,
    insert_user_assignment_mapping_query,
    create_user_query,
    delete_user_assignment_mapping_query,
    delete_assignment_query,
    delete_user_group_mapping_query,
    delete_group_query,
    delete_assignments_from_group_query,
    delete_notinuse_user_assignment_mapping_query,
    cleanup_delete_past_due_5_days_assignments,
    cleanup_delete_assignments_without_groups,
    cleanup_delete_user_assignment_query,
    reminders_get_user_email_ids,
    reminders_get_assignments_query 
};