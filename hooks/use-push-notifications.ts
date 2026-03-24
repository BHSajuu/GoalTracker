import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { urlBase64ToUint8Array } from "@/lib/push-utils";
import { toast } from "sonner"; 

export function usePushNotifications(userId: string | undefined) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveSub = useMutation(api.push.saveSubscription);
  const removeSub = useMutation(api.push.removeSubscription);

  useEffect(() => {
    // Check if the browser supports service workers and push notifications
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };

  const subscribeToPush = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      // 1. Ask for OS-level permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications blocked. Please enable them in your browser settings.");
        setIsLoading(false);
        return;
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 3. Subscribe to Push Manager using your VAPID key
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key missing");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Required for security
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 4. Extract keys to send to Convex
      const subJSON = subscription.toJSON();
      if (!subJSON.keys || !subJSON.endpoint) throw new Error("Invalid subscription object");

      // 5. Save to Convex Database
      await saveSub({
        userId: userId as any,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
        deviceType: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
      });

      setIsSubscribed(true);
      toast.success("Successfully subscribed to notifications!");
    } catch (error: any) {
      console.error("Failed to subscribe:", error);
      toast.error(error.message || "Failed to subscribe to notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Remove from Convex DB
        await removeSub({ endpoint: subscription.endpoint });
        
        // 2. Unsubscribe browser
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success("Notifications disabled for this device.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to unsubscribe.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
  };
}