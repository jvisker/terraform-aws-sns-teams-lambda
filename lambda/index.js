const https = require('https')
const URL = require('url').URL

exports.handler = async function (event, context) {
  console.debug('Event: ' + JSON.stringify(event, null, 2))
  if (process.env.SEND_TO_SLACK === 'false') context.succeed("Skipping sending Slack messages")
  const webhookUrl = new URL(process.env.SLACK_WEBHOOK_URL)
  try {
    await Promise.all(event.Records.map(record => _sendSlackMessage(record.Sns.Message ?? record.Sns.ErrorMessage, webhookUrl)))
    console.info('All messages sent successfully.')
  } catch (e) {
    console.error(e)
    context.fail(e)
  }
}

// https://api.slack.com/reference/surfaces/formatting#escaping
const ampRegex = /&/g
const ltRegex = /</g
const gtRegex = />/g
function escapeForSlack (string) {
  return string.replace(ampRegex, '&amp;').replace(ltRegex, '&lt;').replace(gtRegex, '&gt;')
}

function formatJson(unparsedString) {
  try {
    const parsedData = JSON.parse(unparsedString)
    return JSON.stringify(parsedData, null, 2)
  } catch (e) {
    return unparsedString
  }
}

function _sendSlackMessage (messageText, webhookUrl) {
  const data = JSON.stringify({
    type: 'mrkdwn',
    text: `*[${process.env.APP_NAME.toUpperCase()}]* \n` + '```' + formatJson(escapeForSlack(messageText)) + '```'
  })

  const options = {
    hostname: webhookUrl.hostname,
    port: 443,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, function (res) {
      if (res.statusCode >= 400) {
        reject(new Error(`[Slack API Error] ${res.statusCode} - ${res.statusMessage}`))
      } else {
        console.debug(`Sent message to Slack (code: ${res.statusCode}): ${messageText}`)
        resolve()
      }
    })

    req.on('error', (error) => {
      const errorMsg = `[HTTPS Error] ${error.name} - ${error.message}`
      console.error(errorMsg)
      reject(errorMsg)
    })

    req.write(data)
    req.end()
  })
}
