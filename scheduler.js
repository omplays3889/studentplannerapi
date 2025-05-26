
require('dotenv').config();

const nodemailer = require('nodemailer');
const sql = require("mssql");
const validator = require('validator');
const cron = require('node-cron');

const { queryDatabase } = require('./db.js');

const email_format_duedate = '<div style="margin-left: 14px; font-size: 14px; color: coral; font-weight: bold;">DUEDATE</div>';
const email_format_detail = '<p style="font-size: 14px;">DETAILS</p><span>--------------------</span><span>--------------------</span>'
const email_format_title =  '<p style="font-size: 14px;">TITLE</p>';    

const sendEmail = (email_id, email_body) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'omplays3889@gmail.com',
          pass: process.env.EMAIL_APP_PASSWORD, // Not your Gmail password
        },
      });

    var mailOptions = {
        from: {
            name: 'Your Planner',
            address: 'omplays3889@gmail.com'
        },
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
        const query = 'SELECT DISTINCT TOP 12000 user_email_id FROM tbl_user_assignment_mappings where user_email_id not in '+
        '(SELECT email_id from tbl_users where user_type = \'TEACHER\') order by user_email_id';
        const params = [
        ];
        const email_ids = await queryDatabase(query, params);
        email_ids.forEach(async email_id => {
            let trimmed_email = email_id.user_email_id.trim();
            if (validator.isEmail(trimmed_email)) {
                console.log("Valid emailID : "+ trimmed_email);
                const query = 'SELECT * from tbl_assignments where id in (SELECT DISTINCT TOP 100  assignment_id FROM tbl_user_assignment_mappings where user_email_id = @emailID) order by duedate';
                const params = [
                    { name: 'emailID', type: sql.VarChar, value: email_id.user_email_id}
                ];
                const assignments = await queryDatabase(query, params);
                let html = '';
                
                if (assignments && assignments.length > 0) {
                    assignments.forEach(assignment => {
                        let title = email_format_title.replace('TITLE', assignment.title);
                        let details = email_format_detail.replace('DETAILS', assignment.details);
                        let formattedDate = new Date(assignment.duedate).toLocaleString('en-US', {
                            timeZone: 'America/Los_Angeles',  // Specify PST time zone
                            year: 'numeric',                  // Display full year
                            month: 'short',                   // Display abbreviated month name (e.g., Jan, Feb, etc.)
                            day: 'numeric',                   // Display day of the month
                            hour: 'numeric',                  // Display hours in 12-hour format
                            minute: 'numeric',                // Display minutes
                            hour12: true                      // Use AM/PM
                          })
                        let duedate = email_format_duedate.replace('DUEDATE', formattedDate)
                        assignemnt_formatted =    
                        '<li>' +
                        '<div>' + duedate + title + details
                        '</div>' +
                        '</li>';
                        html += assignemnt_formatted;
                        html += '\n\n';
                    });
                    sendEmail(trimmed_email, html);
                }
            } else {
                console.log("InValid emailID : "+ trimmed_email);
            }
        });
    } catch (e) {

    }
}

cron.schedule('0 0 * * *', () => {
 //cron.schedule('*/2 * * * *', () => {
    processReminders();
  }, {
    scheduled: true
  });
  
console.log('Scheduler is running 0 0...');


module.exports = { sendEmail, processReminders };