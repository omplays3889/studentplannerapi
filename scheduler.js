
const nodemailer = require('nodemailer');
const sql = require("mssql");
const validator = require('validator');
const cron = require('node-cron');

const { queryDatabase } = require('./db.js');

const smtpHost = 'smtppro.zoho.com';
const smtpPort = 465;
const smtpUser = 'help@students-planner.com';
const smtpPass = '!!T@FGDBBCv4kad';

const email_format_duedate = '<div style="margin-left: 14px; font-size: 14px; color: coral; font-weight: bold;">DUEDATE</div>';
const email_format_detail = '<p style="font-size: 14px;">DETAILS</p><span>--------------------</span><span>--------------------</span>'
const email_format_title =  '<p style="font-size: 14px;">TITLE</p>';    

const sendEmail = (email_id, email_body) => {

    let transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: true, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    var mailOptions = {
        from: 'help@students-planner.com',
        to: email_id,
        subject: 'Your assignments reminder',
        html: email_body
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent to: ' + email_id);
        }
    });
}

const processReminders = async () => {
    try {
        const query = 'SELECT DISTINCT TOP 12000 user_email_id FROM tbl_user_assignment_mappings order by user_email_id';
        const params = [
        ];
        const email_ids = await queryDatabase(query, params);
        email_ids.forEach(async email_id => {
            let email = email_id.user_email_id.trim();
            if (validator.isEmail(email)) {
                console.log("Valid emailID : "+ email);
                const query = 'SELECT * from tbl_assignments where id in (SELECT DISTINCT TOP 100  assignment_id FROM tbl_user_assignment_mappings where user_email_id = @emailID)';
                const params = [
                    { name: 'emailID', type: sql.VarChar, value: email}
                ];
                const assignments = await queryDatabase(query, params);
                let html = '';
                console.log(assignments.length);
                if (assignments && assignments.length > 0) {
                    assignments.forEach(assignment => {
                        let title = email_format_title.replace('TITLE', assignment.title);
                        let details = email_format_detail.replace('DETAILS', assignment.details);
                        let duedate = email_format_duedate.replace('DUEDATE', assignment.duedate)
                        assignemnt_formatted =    
                        '<li>' +
                        '<div>' + duedate + title + details
                        '</div>' +
                        '</li>';
                        html += assignemnt_formatted;
                        html += '\n\n';
                    });
                    sendEmail(email, html);
                }
            } else {
                console.log("InValid emailID : "+ email);
            }
        });
    } catch (e) {

    }
}

cron.schedule('0 19 * * *', () => {
    processReminders();
  }, {
    scheduled: true
  });
  
console.log('Scheduler is running...');


module.exports = { sendEmail, processReminders };