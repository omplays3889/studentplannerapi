
require('dotenv').config();
const { DateTime } = require("luxon");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sql = require("mssql");
const validator = require('validator');
const cron = require('node-cron');
const axios = require("axios");

const { queryDatabase } = require('./db.js');

const email_format_duedate = '<li style="font-size: 14px; color: coral; font-weight: bold;">DUEDATE</li>';
const email_format_detail = '<p style="margin-left:55px; font-size: 14px; width: 50%;">DETAILS</p>';
const email_format_title = '<p style="margin-left:55px; font-size: 14px; width: 50%;">TITLE</p>';
const SECRET_KEY = process.env.JWT_UNSUBSCRIBE_TOKEN_KEY;

const changeColor = (duedate, email_txt_duedate) => {
    const dueDate = DateTime.fromISO(duedate, { zone: 'America/Los_Angeles' });
    const now = DateTime.now().setZone('America/Los_Angeles');

    const diffInDays = dueDate.diff(now, 'days').days;

    if (diffInDays < 0 && diffInDays >= -7) {
        return email_txt_duedate.replace("coral", "red")
    } else if (diffInDays >= 0 && diffInDays <= 3) {
        return email_txt_duedate.replace("coral", "coral")
    } else if (diffInDays > 3 && diffInDays <= 7) {
        return email_txt_duedate.replace("coral", "green")
    } else if (diffInDays > 7) {
        return email_txt_duedate.replace("coral", "blue")
    } else {
        return "NONE"
    }
}

function generateUnsubscribeToken(email) {
    return jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
  }

const sendEmail = (email_id, email_body) => {

    if(email_body == '') {
        return
    }

    const token = generateUnsubscribeToken(email_id);
    const unsubscribeLink = `https://my-planner-api-b2cvagfzdqavhca3.westus2-01.azurewebsites.net/api/unsubscribe?token=${token}`;

    email_body += `<div style="margin-left:55px;font-size:11px;"> Too many email reminders? <a href="${unsubscribeLink}" style="font-size:11px;">Unsubscribe</a> </div>`;

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
            console.log("Exception sending Email:"+error);
        } else {
            console.log('Email sent to: ' + email_id);
        }
    });
}

const processReminders = async () => {
    try {
        const query = 'SELECT DISTINCT TOP 12000 user_email_id FROM tbl_user_assignment_mappings';
        const params = [
        ];
        const email_ids = await queryDatabase(query, params);
        email_ids.forEach(async email_id => {
            let trimmed_email = email_id.user_email_id.trim();
            if (validator.isEmail(trimmed_email)) {
                console.log("Valid emailID : " + trimmed_email);
                const query = 'SELECT * from tbl_assignments where id in (SELECT DISTINCT TOP 100  assignment_id FROM tbl_user_assignment_mappings where user_email_id = @emailID) order by duedate';
                const params = [
                    { name: 'emailID', type: sql.VarChar, value: email_id.user_email_id }
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
                        let email_txt_duedate = changeColor(assignment.duedate, email_format_duedate)
                        if (email_txt_duedate == "NONE") {

                        } else {
                            let duedate = email_txt_duedate.replace('DUEDATE', formattedDate)
                            assignemnt_formatted =
                                '<div>' +
                                '<div>' + duedate + title + details
                                '</div>' +
                                '</div>';
                            html += assignemnt_formatted;
                            html += '\n\n';
                        }
                    });
                    sendEmail(trimmed_email, html);
                }
            } else {
                console.log("InValid emailID : " + trimmed_email);
            }
        });
    } catch (e) {
        console.log("Exception in processReminder :"+e);
    }
}

cron.schedule('0 0 * * *', () => {
    console.log("processReminders triggered");
    processReminders();
}, {
    scheduled: true
});

cron.schedule('*/5 * * * *', () => {
     axios.get("https://my-planner-api-b2cvagfzdqavhca3.westus2-01.azurewebsites.net/api/getuser?email_id=cmaheta84@gmail.com", {
        auth: {
          username: process.env.API_USERNAME,
          password: process.env.API_PASSWORD
        }
      })
      .then(() => console.log("pinged api app"))
      .catch(err => console.error("ping api failed", err));

      axios.get("https://my-planner.azurewebsites.net")
      .then(() => console.log("pinged ui app"))
      .catch(err => console.error("ping ui failed", err));
  }, {
    scheduled: true
});

console.log('Scheduler is running with ping version...');

module.exports = { sendEmail, processReminders };