const { app } = require('@azure/functions');
const Handlebars = require('handlebars');
const { EmailClient } = require('@azure/communication-email');
const fs = require('fs');
const path = require('path');

// Use environment variables for sensitive information
const connectionString = "endpoint=https://banco.unitedstates.communication.azure.com/;accesskey=1wSfIr7CjY9GLmNQgNd0m5gpzNntzJrJJSGhbVH0sczQFAwve5npJQQJ99AIACULyCps5mg0AAAAAZCSQ7V5";
const client = new EmailClient(connectionString);

app.http('httpTrigger1', {
    methods: ['POST'],
    handler: async (request, context) => {
        try {
            const requestData = await request.json();
            const { subject, templateName, dataTemplate, to } = requestData;

            // Resolve the path to the template
            const templatePath = path.join(__dirname, templateName);
            if (!fs.existsSync(templatePath)) {
                context.log.error("Template file not found: ${templatePath}");
                return { status: 404, body: 'Template file not found' };
            }

            const source = fs.readFileSync(templatePath, 'utf-8');
            const template = Handlebars.compile(source);
            const html = template(dataTemplate);

            const emailMessage = {
                senderAddress: "DoNotReply@153c7536-cef6-4757-ac01-f03b49ef490d.azurecomm.net",
                content: {
                    subject: subject,
                    html: html,
                },
                recipients: {
                    to: [{ address: to }],
                },
            };

            const poller = await client.beginSend(emailMessage);
            await poller.pollUntilDone();

            return { body: 'Email sent successfully' };
        } catch (error) {
            context.log.error('Failed to send email', error);
            return { status: 500, body: 'Failed to send email' };
        }
    }
});
