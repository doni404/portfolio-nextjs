type AnalyticsValue = string | number | boolean;

type AnalyticsParams = Record<string, AnalyticsValue>;

type Gtag = (
  command: "event",
  eventName: string,
  params?: AnalyticsParams
) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export function trackEvent(eventName: string, params?: AnalyticsParams) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}
