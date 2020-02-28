const helper = require('sendgrid').mail; 
const sg = require('sendgrid')("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");
const from_email = new helper.Email("no-reply@cloudes.eu");
module.exports = {
    sendOnboardingMail : (user, callback) => {
        let to_email = new helper.Email(user.email);
        let subject = "Welcome to CloudEs";
        let content = new helper.Content("text/html", "<h1>Welcome to clouds "+user.firstName+"</h1> \n <h2> Thank you for choosing Clouds </h2> \n <h2>Your Temprory password is <code><b>"+user.password+"</b></code></h2>");
        let mail = new helper.Mail(from_email, subject, to_email, content);
        let request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            template_id : "1757810c-9d8e-4d83-9a17-d84d37dc3e18",
            body: mail.toJSON()
        });
        sg.API(request,callback);
    },
}