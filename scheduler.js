
require('dotenv').config();
const { DateTime } = require("luxon");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');
const cron = require('node-cron');
const axios = require("axios");
const queries = require('./dbqueries');

const { queryDatabase } = require('./db.js');

const zone_legends='<table style="margin-bottom: 16px; margin-left: 5px; width:290px;"> \
<tr> \
  <td style="padding-left: 27px; font-size: 11px; font-family: sans-serif;"> \
    Red \
  </td> \
  <td style="width: 5px;"></td> \
  <td style="padding-left: 27px; font-size: 11px; font-family: sans-serif;"> \
    Coral\
  </td> \
  <td style="width: 5px;"></td> \
  <td style="padding-left: 27px; font-size: 11px; font-family: sans-serif;"> \
    Blue\
  </td> \
</tr> \
<tr> \
  <td style="padding: 6px 10px; background-color: indianred; color: white; border-radius: 999px; font-size: 9px; font-family: sans-serif;"> \
    Past Due Date\
  </td> \
  <td style="width: 5px;"></td> \
  <td style="padding: 6px 10px; background-color: coral; color: white; border-radius: 999px; font-size: 9px; font-family: sans-serif;"> \
    Due in 1-5 days\
  </td> \
  <td style="width: 5px;"></td> \
  <td style="padding: 6px 10px; background-color: rgb(21, 100, 255); color: white; border-radius: 999px; font-size: 9px; font-family: sans-serif;"> \
    Due in 5+ days\
  </td> \
</tr> \
</table>';
const email_format_duedate = '<div style="font-size: 14px; margin-left: 75px; color: coral; margin-bottom: 8px; font-weight: bold;">DUEDATE</div>';
const email_format_title = '<p style="margin-left: 75px; font-size: 14px; width: 50%; margin-top: 0; margin-bottom: 2px;">TITLE</p>';
const email_format_detail = '<p style="margin-left: 75px; font-size: 14px; color: gray; width: 50%; margin-top: 0; margin-bottom: 8px;">DETAILS</p>';
const SECRET_KEY = process.env.JWT_UNSUBSCRIBE_TOKEN_KEY;

const changeColor = (duedate, email_txt_duedate) => {
    const dueDate = DateTime.fromISO(duedate, { zone: 'America/Los_Angeles' });
    const now = DateTime.now().setZone('America/Los_Angeles');

    const diffInDays = dueDate.diff(now, 'days').days;

    if (diffInDays <= 0 && diffInDays >= -5) {
        return email_txt_duedate.replace("coral", "indianred")
    } else if (diffInDays > 0 && diffInDays <= 5) {
        return email_txt_duedate.replace("coral", "coral")
    } else if (diffInDays > 5) {
        return email_txt_duedate.replace("coral", "rgb(21, 100, 255)")
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

    email_body += zone_legends;
    email_body += `<div style="margin-left:12px;font-size:11px;">Want to stop receiving email reminders? <a href="${unsubscribeLink}" style="font-size:11px;">Unsubscribe </a> </div>`;

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

const cleanUp = async () => {

    let query = queries.cleanup_delete_past_due_5_days_assignments;
    await queryDatabase(query, null);

    query = queries.cleanup_delete_assignments_without_groups;
    await queryDatabase(query, null);

    query = queries.cleanup_delete_user_assignment_query;
    await queryDatabase(query, null);

}
const processReminders = async () => {
    try {
        const query = queries.reminders_get_user_email_ids;
        const params = [
        ];
        const email_ids = await queryDatabase(query, params);
        email_ids.forEach(async email_id => {
            let trimmed_email = email_id.user_email_id.trim();
            if (validator.isEmail(trimmed_email)) {
                console.log("Valid emailID : " + trimmed_email);
                const query = queries.reminders_get_assignments_query;
                const params = [email_id.user_email_id];
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
                            html += '<hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0; margin-left: 5px; width: 290px;">';
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

cron.schedule('5 5 * * *', () => {
    console.log("cleanUp triggered");
    cleanUp();
}, {
    scheduled: true
});

cron.schedule('*/15 * * * *', () => {
     axios.get("https://my-planner-api-b2cvagfzdqavhca3.westus2-01.azurewebsites.net/api/health", {
        auth: {
          username: process.env.API_USERNAME,
          password: process.env.API_PASSWORD
        }
      })
      .then(() => console.log("pinged api health endpoint"))
      .catch(err => console.error("ping api failed", err));

      axios.get("https://www.students-planner.net")
      .then(() => console.log("pinged ui app"))
      .catch(err => console.error("ping ui failed", err));
  }, {
    scheduled: true
});

console.log('Scheduler is running with ping version...');

module.exports = { sendEmail, processReminders };