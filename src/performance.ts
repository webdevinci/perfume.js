// Types
import {
  IMetricEntry,
  IPerformanceEntry,
  IPerformanceObserverType,
  IPerfumeConfig,
} from './perfume';

export interface IPerformancePaintTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

declare const PerformanceObserver: any;

declare interface IPerformanceObserverEntryList {
  getEntries: any;
  getEntriesByName: any;
  getEntriesByType: any;
}

export default class Performance {
  /**
   * True if the browser supports the Navigation Timing API,
   * User Timing API and the PerformanceObserver Interface.
   * In Safari, the User Timing API (performance.mark()) is not available,
   * so the DevTools timeline will not be annotated with marks.
   * Support: developer.mozilla.org/en-US/docs/Web/API/Performance/mark
   * Support: developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
   */
  static supported(): boolean {
    return window.performance && !!performance.now && !!performance.mark;
  }

  /**
   * For now only Chrome fully support the PerformanceObserver interface
   * and the entryType "paint".
   * Firefox 58: https://bugzilla.mozilla.org/show_bug.cgi?id=1403027
   */
  static supportedPerformanceObserver(): boolean {
    return (window as any).chrome && 'PerformanceObserver' in window;
  }

  private perfObserver: any;

  constructor(public config: IPerfumeConfig) {}

  /**
   * When performance API available
   * returns a DOMHighResTimeStamp, measured in milliseconds, accurate to five
   * thousandths of a millisecond (5 microseconds).
   */
  now(): number {
    return window.performance.now();
  }

  mark(metricName: string, type: string): void {
    const mark = `mark_${metricName}_${type}`;
    (window.performance.mark as any)(mark);
  }

  measure(metricName: string, metric: IMetricEntry): number {
    const startMark = `mark_${metricName}_start`;
    const endMark = `mark_${metricName}_end`;
    (window.performance.measure as any)(metricName, startMark, endMark);
    return this.getDurationByMetric(metricName, metric);
  }

  /**
   * PerformanceObserver subscribes to performance events as they happen
   * and respond to them asynchronously.
   */
  performanceObserver(
    eventType: IPerformanceObserverType,
    cb: (entries: any[]) => void,
  ): void {
    this.perfObserver = new PerformanceObserver(
      this.performanceObserverCb.bind(this, cb),
    );
    // Retrieve buffered events and subscribe to newer events for Paint Timing
    this.perfObserver.observe({ type: eventType, buffered: true });
  }

  /**
   * Get the duration of the timing metric or -1 if there a measurement has
   * not been made by the User Timing API
   */
  private getDurationByMetric(
    metricName: string,
    metric: IMetricEntry,
  ): number {
    const entry = this.getMeasurementForGivenName(metricName);
    if (entry && entry.entryType === 'measure') {
      return entry.duration;
    }
    return -1;
  }

  /**
   * Return the last PerformanceEntry objects for the given name.
   */
  private getMeasurementForGivenName(metricName: string): PerformanceEntry {
    const entries = (window.performance as any).getEntriesByName(metricName);
    return entries[entries.length - 1];
  }

  private performanceObserverCb(
    cb: (entries: PerformanceEntry[]) => void,
    entryList: IPerformanceObserverEntryList,
  ): void {
    const entries = entryList.getEntries();
    cb(entries);
  }
}
