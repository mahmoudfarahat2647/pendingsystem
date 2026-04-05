export const NOTIFICATION_CHECK_INTERVAL_MS = 10_000;
export const NOTIFICATION_INITIAL_DELAY_MS = 3_000;
export const NOTIFICATION_FRESHNESS_WINDOW_MS = 8_000;

export interface NotificationPollingState {
	dataVersion: number;
	lastRunAt: number;
}

export function shouldRunNotificationCheck(
	currentDataVersion: number,
	currentTime: number,
	lastCheck: NotificationPollingState,
): boolean {
	if (lastCheck.lastRunAt === 0) {
		return true;
	}

	if (currentDataVersion !== lastCheck.dataVersion) {
		return true;
	}

	return currentTime - lastCheck.lastRunAt >= NOTIFICATION_FRESHNESS_WINDOW_MS;
}
