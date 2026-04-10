import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('training-reminders', {
      name: 'Training Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
    await Notifications.setNotificationChannelAsync('rest-timer', {
      name: 'Rest Timer',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 100],
      lightColor: '#22C55E',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

/** Schedule a daily training reminder */
export async function scheduleTrainingReminder(hour: number, minute: number): Promise<string> {
  // Cancel existing reminders first
  await cancelTrainingReminders();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '💪 Time to train!',
      body: "Your workout is waiting. Let's crush it today.",
      data: { type: 'training-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelTrainingReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminders = scheduled.filter(
    (n) => (n.content.data as Record<string, unknown>)?.['type'] === 'training-reminder'
  );
  await Promise.all(reminders.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/** Local notification when rest timer ends */
export async function scheduleRestEndNotification(seconds: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Rest complete',
      body: 'Time for your next set!',
      data: { type: 'rest-timer' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

export async function cancelRestEndNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
