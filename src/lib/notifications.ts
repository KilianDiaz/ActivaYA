"use client";
import type { Pausa } from './types';

// Store for fallback setTimeout timers
const timeoutStore: { [key: string]: NodeJS.Timeout } = {};

const dayNameToNumber: { [key: string]: number } = {
  'Domingo': 0,
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6,
};

function getNextNotificationTime(breakItem: Pausa): number | null {
  const now = new Date();
  const [hours, minutes] = breakItem.hora.split(':').map(Number);
  
  const sortedDays = breakItem.dias.map(day => dayNameToNumber[day]).sort((a,b) => a - b);
  if(sortedDays.length === 0) return null;

  for (let i = 0; i < 8; i++) { // Check up to 8 days to be safe
    const date = new Date();
    date.setDate(now.getDate() + i);
    const dayOfWeek = date.getDay();

    if (sortedDays.includes(dayOfWeek)) {
      const potentialNotificationTime = new Date(date);
      potentialNotificationTime.setHours(hours, minutes, 0, 0);

      if (potentialNotificationTime > now) {
        return potentialNotificationTime.getTime();
      }
    }
  }

  return null;
}


export async function scheduleNotification(breakItem: Pausa) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const registration = await navigator.serviceWorker.ready;
  if (!registration || !registration.showNotification) {
    return;
  }

  // Always cancel any existing notification for this break before scheduling a new one.
  await cancelNotification(breakItem.id);

  const notificationTime = getNextNotificationTime(breakItem);
  
  if (notificationTime) {
    console.log(`Scheduling notification for '${breakItem.nombre}' at ${new Date(notificationTime).toLocaleString()}.`);
    
    const notificationOptions = {
        tag: breakItem.id,
        body: breakItem.recordatorio || `Es momento de '${breakItem.nombre}'.`,
        icon: '/logo192.svg',
        badge: '/logo-mono.svg',
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: true,
        data: {
          url: `/break/${breakItem.id}`,
        },
        actions: [
            { action: 'view', title: 'Ver Pausa' },
            { action: 'skip', title: 'Saltar Pausa' }
        ]
    };
    
    // @ts-ignore
    if ('showTrigger' in Notification.prototype) {
        try {
          // @ts-ignore
          await registration.showNotification('¡Hora de tu pausa activa!', {
              ...notificationOptions,
              timestamp: notificationTime,
              // @ts-ignore
              showTrigger: new TimestampTrigger(notificationTime),
          });
          console.log("Scheduled notification with Trigger.");
        } catch(e) {
            console.error("Error scheduling with Trigger, using fallback: ", e);
            const delay = notificationTime - Date.now();
            if (delay > 0) {
              const timerId = setTimeout(() => {
                  registration.showNotification('¡Hora de tu pausa activa!', notificationOptions);
                  delete timeoutStore[breakItem.id];
              }, delay);
              timeoutStore[breakItem.id] = timerId;
            }
        }
    } else {
        const delay = notificationTime - Date.now();
        if(delay > 0) {
           const timerId = setTimeout(() => {
                registration.showNotification('¡Hora de tu pausa activa!', notificationOptions);
                console.log("Scheduled notification with Fallback (setTimeout).");
                delete timeoutStore[breakItem.id];
            }, delay);
           timeoutStore[breakItem.id] = timerId;
        }
    }
  }
}

export async function cancelNotification(breakId: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) return;

    // --- CRITICAL FIX: Cancel fallback timer if it exists ---
    if (timeoutStore[breakId]) {
      clearTimeout(timeoutStore[breakId]);
      delete timeoutStore[breakId];
      console.log(`Cleared fallback timer for break ${breakId}`);
    }
    // ---

    // Cancel visible notifications
    const notifications = await registration.getNotifications({ tag: breakId });
    notifications.forEach(notification => notification.close());

    // Cancel scheduled notifications by overwriting with an expired one.
    // @ts-ignore
    if ('showTrigger' in Notification.prototype) {
        // @ts-ignore
        await registration.showNotification('Cancelling notification', {
            tag: breakId,
            body: '',
            silent: true,
            // @ts-ignore
            showTrigger: new TimestampTrigger(0),
        });
    }

    console.log(`Cancelled notification for break ${breakId}`);
  } catch (error) {
     console.error("Error cancelling notification: ", error)
  }
}

export async function syncAllNotifications(breaks: Pausa[]) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) return;

      // Cancel all existing scheduled notifications
      const activeBreakIds = new Set(breaks.map(b => b.id));
      const notifications = await registration.getNotifications();
      for(const notification of notifications) {
          notification.close();
          // Also try to cancel any potential scheduled notification
          await cancelNotification(notification.tag);
      }
      
      // Clear all fallback timers
      for (const id in timeoutStore) {
        clearTimeout(timeoutStore[id]);
        delete timeoutStore[id];
      }

      console.log(`Scheduling notifications for ${breaks.filter(b => b.activa).length} active breaks.`);
      for (const breakItem of breaks) {
          if(breakItem.activa) {
              await scheduleNotification(breakItem);
          }
      }
      console.log("All notifications have been re-synced.");
    } catch (error) {
      console.error("Error during notification sync: ", error);
    }
}
