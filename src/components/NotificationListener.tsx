import { usePushNotifications } from '@/hooks/usePushNotifications';

const NotificationListener = () => {
  // Mount the push notification hook globally so order status notifications fire on every page
  usePushNotifications();
  return null;
};

export default NotificationListener;
