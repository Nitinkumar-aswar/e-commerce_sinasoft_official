const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
console.log("AWS KEY:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS SECRET:", process.env.AWS_SECRET_ACCESS_KEY ? "LOADED" : "MISSING");
console.log("AWS REGION:", process.env.AWS_REGION);

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function sendOTP(mobile, otp) {
  const message = `Your AutoKart OTP is ${otp}. Valid for 5 minutes.`;

  const params = {
    Message: message,
    PhoneNumber: `+91${mobile}`,
    MessageAttributes: {
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: "Transactional"
      }
    }
  };

  await snsClient.send(new PublishCommand(params));
}

module.exports = { sendOTP };
