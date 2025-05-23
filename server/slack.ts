import { type ChatPostMessageArguments, WebClient } from "@slack/web-api"
import { Deal } from "@shared/schema";

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error("SLACK_BOT_TOKEN environment variable must be set");
}

if (!process.env.SLACK_CHANNEL_ID) {
  throw new Error("SLACK_CHANNEL_ID environment variable must be set");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 */
async function sendSlackMessage(
  message: ChatPostMessageArguments
): Promise<string | undefined> {
  try {
    const response = await slack.chat.postMessage(message);
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

/**
 * Send due date reminder for a deal
 */
export async function sendDueDateReminder(deal: Deal, daysUntilDue: number): Promise<void> {
  const channel = process.env.SLACK_CHANNEL_ID!;
  
  const urgencyEmoji = deal.priority === "高" ? "🚨" : deal.priority === "中" ? "⚠️" : "📝";
  const phaseEmoji = "🏠";
  
  const message = {
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${urgencyEmoji} *不動産案件の期限が近づいています*`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*案件名:*\n${deal.title}`
          },
          {
            type: 'mrkdwn',
            text: `*顧客:*\n${deal.client || '未設定'}`
          },
          {
            type: 'mrkdwn',
            text: `*現在フェーズ:*\n${deal.phase}`
          },
          {
            type: 'mrkdwn',
            text: `*緊急度:*\n${deal.priority}`
          },
          {
            type: 'mrkdwn',
            text: `*期日:*\n${new Date(deal.dueDate).toLocaleDateString('ja-JP')}`
          },
          {
            type: 'mrkdwn',
            text: `*残り日数:*\n${daysUntilDue}日`
          }
        ]
      }
    ]
  };

  if (deal.notes) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*メモ:* ${deal.notes}`
      }
    });
  }

  await sendSlackMessage(message);
  console.log(`Slack reminder sent for deal: ${deal.title} (${daysUntilDue} days until due)`);
}

/**
 * Send multiple due date reminders
 */
export async function sendBulkDueDateReminders(deals: Deal[]): Promise<void> {
  const channel = process.env.SLACK_CHANNEL_ID!;
  
  if (deals.length === 0) return;

  const summaryMessage = {
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📋 *本日の期限リマインダー* (${deals.length}件)`
        }
      },
      {
        type: 'divider'
      }
    ]
  };

  // Send summary first
  await sendSlackMessage(summaryMessage);

  // Send individual reminders
  for (const deal of deals) {
    const dueDate = new Date(deal.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    await sendDueDateReminder(deal, daysUntilDue);
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export { sendSlackMessage };