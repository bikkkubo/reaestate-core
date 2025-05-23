import { storage } from "./storage";
import { sendDueDateReminder, sendBulkDueDateReminders } from "./slack";
import { Deal } from "@shared/schema";

/**
 * Check for deals that are due in 2 days and send Slack notifications
 */
export async function checkAndSendDueDateReminders(): Promise<void> {
  try {
    const deals = await storage.getAllDeals();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Filter deals due in exactly 2 days (and not completed)
    const dealsToRemind = deals.filter(deal => {
      if (deal.phase === "⑩契約終了") return false; // Skip completed deals
      
      const dueDate = new Date(deal.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays === 2; // Exactly 2 days until due
    });

    if (dealsToRemind.length > 0) {
      console.log(`Found ${dealsToRemind.length} deals due in 2 days, sending Slack reminders...`);
      await sendBulkDueDateReminders(dealsToRemind);
    } else {
      console.log("No deals due in 2 days - no reminders to send");
    }
  } catch (error) {
    console.error("Error checking due date reminders:", error);
  }
}

/**
 * Start the daily notification scheduler
 * Runs every day at 9:00 AM
 */
export function startNotificationScheduler(): void {
  // Check immediately on startup
  checkAndSendDueDateReminders();

  // Schedule to run every day at 9:00 AM
  const scheduleDaily = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM

    // If it's already past 9 AM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilScheduled = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      checkAndSendDueDateReminders();
      
      // Schedule the next check for 24 hours later
      setInterval(checkAndSendDueDateReminders, 24 * 60 * 60 * 1000);
    }, timeUntilScheduled);

    console.log(`Due date reminders scheduled for: ${scheduledTime.toLocaleString('ja-JP')}`);
  };

  scheduleDaily();
}

/**
 * Manual trigger for testing reminders (API endpoint)
 */
export async function triggerManualReminders(): Promise<{ sent: number; deals: Deal[] }> {
  const deals = await storage.getAllDeals();
  const today = new Date();
  
  // For manual trigger, check deals due in 0-3 days (more flexible for testing)
  const dealsToRemind = deals.filter(deal => {
    if (deal.phase === "⑩契約終了") return false;
    
    const dueDate = new Date(deal.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 3; // Due in next 3 days
  });

  if (dealsToRemind.length > 0) {
    await sendBulkDueDateReminders(dealsToRemind);
  }

  return {
    sent: dealsToRemind.length,
    deals: dealsToRemind
  };
}