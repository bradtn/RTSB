import toast from 'react-hot-toast';

export type NotificationType = 'your_turn' | 'next_in_line' | 'reminder' | 'custom';
export type SendMethod = 'email' | 'sms' | 'both';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  customSubject?: string;
  customMessage?: string;
  sendMethod?: SendMethod;
}

interface MarkCompletedParams {
  userId: string;
}

class NotificationService {
  /**
   * Send a notification to a specific officer
   */
  async sendNotification(params: SendNotificationParams): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          sendMethod: params.sendMethod || 'email',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Notification sent successfully!');
        return true;
      } else {
        toast.error(result.message || 'Failed to send notification');
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
      return false;
    }
  }

  /**
   * Send bulk notifications to multiple officers
   */
  async sendBulkNotifications(
    recipientIds: string[],
    params: Omit<SendNotificationParams, 'userId'>
  ): Promise<{ successCount: number; errorCount: number }> {
    let successCount = 0;
    let errorCount = 0;
    
    for (const userId of recipientIds) {
      const success = await this.sendNotification({
        userId,
        ...params,
      });
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    // Show results
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully sent ${successCount} notification${successCount > 1 ? 's' : ''}!`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.success(`Sent ${successCount} notifications, ${errorCount} failed`);
    } else {
      toast.error('All notifications failed to send');
    }
    
    return { successCount, errorCount };
  }

  /**
   * Mark an officer as completed and trigger automatic notifications
   */
  async markAsCompleted(params: MarkCompletedParams): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/notifications/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Officer marked as completed!');
        if (result.nextInLine) {
          toast.success(`${result.nextInLine.name} is now up to bid!`);
        }
        return true;
      } else {
        toast.error(result.message || 'Failed to mark as completed');
        return false;
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast.error('Failed to mark as completed');
      return false;
    }
  }

  /**
   * Upload seniority list from CSV file
   */
  async uploadSeniorityList(file: File): Promise<{
    success: boolean;
    message: string;
    processed?: number;
    errors?: string[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/seniority/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully uploaded ${result.processed} officers!`);
      } else {
        toast.error('Upload failed. Check the results below.');
      }
      
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed due to network error');
      return {
        success: false,
        message: 'Upload failed due to network error',
      };
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(recentMinutes?: number) {
    try {
      const url = recentMinutes 
        ? `/api/admin/notifications/history?recent=${recentMinutes}`
        : '/api/admin/notifications/history';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  /**
   * Check if a notification was recently sent
   */
  shouldShowConfirmation(
    recentNotification: { minutesAgo: number; isMatchingType: boolean } | null,
    threshold: number = 10
  ): boolean {
    return !!(
      recentNotification && 
      recentNotification.isMatchingType && 
      recentNotification.minutesAgo < threshold
    );
  }

  /**
   * Get confirmation message for recent notification
   */
  getConfirmationMessage(
    officerName: string,
    minutesAgo: number,
    notificationType: string
  ): string {
    return `${officerName} was notified ${minutesAgo} minutes ago (${notificationType}). Send another notification?`;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();