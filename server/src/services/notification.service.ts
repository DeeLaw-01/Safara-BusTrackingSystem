import admin from 'firebase-admin';
import twilio from 'twilio';

import User from '../models/user.model';
import Reminder from '../models/reminder.model';
import Stop from '../models/stop.model';
import { getDistance } from './location.service';
import { BusLocationCache } from '../config/redis';

// Initialize Firebase Admin (if credentials are provided)
let firebaseInitialized = false;

function initializeFirebase(): boolean {
  if (firebaseInitialized) return true;
  
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
      console.log('Firebase Admin initialized');
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }
  return false;
}

// Initialize Twilio client
function getTwilioClient(): twilio.Twilio | null {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  ) {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return null;
}

// Send push notification via FCM
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!initializeFirebase()) {
    console.warn('Firebase not initialized, skipping push notification');
    return false;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'bus-tracking',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

// Send SMS via Twilio
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  const twilioClient = getTwilioClient();
  
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

// Check and send reminder notifications for approaching buses
export async function checkAndSendReminders(
  busLocation: BusLocationCache
): Promise<void> {
  try {
    // Get active reminders for this route
    const reminders = await Reminder.find({
      routeId: busLocation.routeId,
      isActive: true,
    }).populate('userId').populate('stopId');

    for (const reminder of reminders) {
      const stop = reminder.stopId as unknown as { latitude: number; longitude: number; name: string };
      const user = reminder.userId as unknown as { fcmToken?: string; phone?: string; name: string };

      if (!stop || !user) continue;

      // Calculate distance to stop
      const distance = getDistance(
        busLocation.latitude,
        busLocation.longitude,
        stop.latitude,
        stop.longitude
      );

      // Estimate time based on average speed (or use actual speed if available)
      const speed = busLocation.speed || 30; // km/h
      const timeInMinutes = (distance / 1000) / speed * 60;

      // Check if bus is within reminder threshold
      if (timeInMinutes <= reminder.minutesBefore) {
        const title = 'Bus Approaching!';
        const body = `Your bus is approximately ${Math.round(timeInMinutes)} minutes away from ${stop.name}`;

        // Send notifications based on type
        if (reminder.notificationType === 'push' || reminder.notificationType === 'both') {
          if (user.fcmToken) {
            await sendPushNotification(user.fcmToken, title, body, {
              routeId: busLocation.routeId,
              busId: busLocation.busId,
              stopId: reminder.stopId.toString(),
            });
          }
        }

        if (reminder.notificationType === 'sms' || reminder.notificationType === 'both') {
          if (user.phone) {
            await sendSMS(user.phone, `${title}\n${body}`);
          }
        }

        // Optionally deactivate reminder after sending (to prevent spam)
        // await Reminder.findByIdAndUpdate(reminder._id, { isActive: false });
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}
