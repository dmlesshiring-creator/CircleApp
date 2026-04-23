import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, push, set } from 'firebase/database';
import { db } from './firebase';

/**
 * Message Queue Service
 * 
 * Handles offline message queueing and sending when back online
 */

export interface QueuedMessage {
  id: string;
  circleId: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

/**
 * Get queue key for a circle
 */
const getQueueKey = (circleId: string): string => {
  return `message_queue_${circleId}`;
};

/**
 * Add message to queue
 */
export const addToQueue = async (
  circleId: string,
  text: string,
  senderId: string,
  senderName: string
): Promise<QueuedMessage> => {
  try {
    const queueKey = getQueueKey(circleId);
    
    // Create queued message
    const queuedMessage: QueuedMessage = {
      id: `pending_${Date.now()}_${Math.random()}`,
      circleId,
      text,
      senderId,
      senderName,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Get existing queue
    const existingQueue = await getQueue(circleId);
    
    // Add to queue
    const updatedQueue = [...existingQueue, queuedMessage];
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(queueKey, JSON.stringify(updatedQueue));
    
    return queuedMessage;
  } catch (error) {
    console.error('Error adding message to queue:', error);
    throw error;
  }
};

/**
 * Get all queued messages for a circle
 */
export const getQueue = async (circleId: string): Promise<QueuedMessage[]> => {
  try {
    const queueKey = getQueueKey(circleId);
    const queueData = await AsyncStorage.getItem(queueKey);
    
    if (queueData) {
      return JSON.parse(queueData);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting message queue:', error);
    return [];
  }
};

/**
 * Update message status in queue
 */
export const updateMessageStatus = async (
  circleId: string,
  messageId: string,
  status: QueuedMessage['status']
): Promise<void> => {
  try {
    const queueKey = getQueueKey(circleId);
    const queue = await getQueue(circleId);
    
    const updatedQueue = queue.map((msg) =>
      msg.id === messageId ? { ...msg, status } : msg
    );
    
    await AsyncStorage.setItem(queueKey, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error updating message status:', error);
  }
};

/**
 * Remove message from queue
 */
export const removeFromQueue = async (
  circleId: string,
  messageId: string
): Promise<void> => {
  try {
    const queueKey = getQueueKey(circleId);
    const queue = await getQueue(circleId);
    
    const updatedQueue = queue.filter((msg) => msg.id !== messageId);
    
    await AsyncStorage.setItem(queueKey, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error removing message from queue:', error);
  }
};

/**
 * Send a queued message to Firebase
 */
export const sendQueuedMessage = async (
  message: QueuedMessage
): Promise<boolean> => {
  try {
    // Update status to sending
    await updateMessageStatus(message.circleId, message.id, 'sending');
    
    // Send to Firebase Realtime Database
    const messagesRef = ref(db, `circles/${message.circleId}/messages`);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      type: 'text',
      text: message.text,
      senderId: message.senderId,
      senderName: message.senderName,
      createdAt: message.createdAt,
    });
    
    // Remove from queue after successful send
    await removeFromQueue(message.circleId, message.id);
    
    return true;
  } catch (error) {
    console.error('Error sending queued message:', error);
    
    // Update status to failed
    await updateMessageStatus(message.circleId, message.id, 'failed');
    
    return false;
  }
};

/**
 * Flush all queued messages for a circle
 */
export const flushQueue = async (circleId: string): Promise<void> => {
  try {
    const queue = await getQueue(circleId);
    
    // Filter only pending messages
    const pendingMessages = queue.filter((msg) => msg.status === 'pending');
    
    if (pendingMessages.length === 0) {
      console.log('No pending messages to flush');
      return;
    }
    
    console.log(`Flushing ${pendingMessages.length} pending messages...`);
    
    // Send messages in order
    for (const message of pendingMessages) {
      await sendQueuedMessage(message);
      
      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    console.log('Queue flushed successfully');
  } catch (error) {
    console.error('Error flushing queue:', error);
  }
};

/**
 * Clear all queued messages for a circle
 */
export const clearQueue = async (circleId: string): Promise<void> => {
  try {
    const queueKey = getQueueKey(circleId);
    await AsyncStorage.removeItem(queueKey);
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
};

/**
 * Get count of pending messages
 */
export const getPendingCount = async (circleId: string): Promise<number> => {
  try {
    const queue = await getQueue(circleId);
    return queue.filter((msg) => msg.status === 'pending').length;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return 0;
  }
};
