import {Injectable} from '@angular/core';
import {Observable, Subject, of, throwError} from 'rxjs';
import {tap, catchError} from 'rxjs/operators';


interface CacheContent {
  expiry: number;
  value: any;
}

@Injectable({
  providedIn: 'root'
})


/**
 * Cache Service is an observables based in-memory cache implementation
 * Keeps track of in-flight observables and sets a default expiry for cached values
 * @export
 * @class CacheService
 */
export class CacheService {

  constructor() {
    // const cache = JSON.parse(localStorage.getItem('CacheServiceCache')) as Map<string, CacheContent>;
    // this.cache = (!!cache) ? cache : new Map<string, CacheContent>();
    this.cache = new Map<string, CacheContent>();
  }

  private readonly cache: Map<string, CacheContent>;
  private observables: Map<string, Subject<any>> = new Map<string, Subject<any>>();
  readonly DEFAULT_MAX_AGE: number = 60000;

  static hasValidLocalStorageValue(key: string): boolean {
    if (!!localStorage.getItem(key)) {
      if (JSON.parse(localStorage.getItem(key)).expiry < Date.now()) {
        localStorage.removeItem(key);
        return false;
      }
      return true;
    } else {
      return false;
    }
  }


  getValue(key: string): any {

    if (this.hasValidCachedValue(key)) {
      return this.cache.get(key).value;
    }
    if (CacheService.hasValidLocalStorageValue(key)) {
      return JSON.parse(localStorage.getItem(key)).value;
    }
  }

  /**
   * Gets the value from cache if the key is provided.
   * If no value exists in cache, then check if the same call exists
   * in flight, if so return the subject. If not create a new
   * Subject inFlightObservable and return the source observable.
   */
  get(key: string, fallback?: Observable<any>, maxAge?: number): Observable<any> | Subject<any> {

    if (this.hasValidCachedValue(key)) {
      return of(this.cache.get(key).value);
    }
    if (CacheService.hasValidLocalStorageValue(key)) {
      return of(JSON.parse(localStorage.getItem(key)).value);
    }

    if (!maxAge) {
      maxAge = this.DEFAULT_MAX_AGE;
    }

    if (this.observables.has(key)) {
      return this.observables.get(key);
    } else if (fallback && fallback instanceof Observable) {
      this.observables.set(key, new Subject());
      return fallback.pipe(tap((value) => {
        this.set(key, value, maxAge);
      }), catchError((e: any) => { // `fallback` are crashed
        // crashed flight is terrible😰, it's better to clean it up...
        this.observables.delete(key);
        // and when we have done our job, it's good idea to let the others know this event.
        // maybe they have their stuffs need to be done too.
        return throwError(e);
      }));
    } else {
      return throwError('Requested key is not available in Cache');
    }

  }

  /**
   * Sets the value with key in the cache
   * Notifies all observers of the new value
   */
  set(key: string, value: any, maxAge: number = this.DEFAULT_MAX_AGE): void {
    this.cache.set(key, { value, expiry: Date.now() + maxAge});

    localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + maxAge}));

    this.notifyInFlightObservers(key, value);
  }

  /**
   * Checks if the a key exists in cache
   */
  has(key: string): boolean {
    return (this.cache.has(key) || CacheService.hasValidLocalStorageValue(key));
  }

  /**
   * Publishes the value to all observers of the given
   * in progress observables if observers exist.
   */
  private notifyInFlightObservers(key: string, value: any): void {
    if (this.observables.has(key)) {
      const inFlight = this.observables.get(key);
      const observersCount = inFlight.observers.length;
      if (observersCount) {
        inFlight.next(value);
      }
      inFlight.complete();
      this.observables.delete(key);
    }
  }

  /**
   * Checks if the key exists and   has not expired.
   */
  private hasValidCachedValue(key: string): boolean {
    if (this.cache.has(key)) {
      if (this.cache.get(key).expiry < Date.now()) {
        this.cache.delete(key);
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  hasValidKey(key: string): boolean {
    return (this.hasValidCachedValue(key) || CacheService.hasValidLocalStorageValue(key));
  }
}
