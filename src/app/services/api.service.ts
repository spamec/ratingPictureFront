import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {CacheService} from './cache.service';
import {map} from 'rxjs/operators';
import {Md5} from 'ts-md5/dist/md5';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // _getList: StringKeyObject = {};
  // ready = new Subject<any>();


  httpOptions: { headers: HttpHeaders };

  constructor(private http: HttpClient, private cache: CacheService) {
    this.init();
  }

  init(): void {
    this.httpOptions = (!environment.production) ? {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        // Authorization: `Token 564798d3340cd01694a7bbd942b22d589aa5d486`
      })
    } : {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      })
    };
  }

  get<T>(path, cached = false, full = false, options = null, cachedValue = null): Observable<T> {
    const md5 = new Md5();

    const url = (!full) ? `${environment.api}${path}` : path;
    const key = String(md5.appendStr(`get:${path}`).end());
    return (cached && this.cache.hasValidKey(key)) ? this.cache.get(key) : this.http.get(url, options ? options : this.httpOptions)
      .pipe(map(data => {
        if (cached) {
          this.cache.set(key, data, (cachedValue) ? cachedValue : 600000);
        }
        return data;
      }));
  }

  post<T>(path, data, full = false): Observable<HttpResponse<{}>> {
    const url = (!full) ? `${environment.api}${path}/` : path;
    return this.http.post(url, data, {...this.httpOptions, ...{observe: 'response'}});
  }


  put<T>(path, data, full = false): Observable<HttpResponse<{}>> {
    const url = (!full) ? `${environment.api}${path}/` : path;
    return this.http.put(url, data, {...this.httpOptions, ...{observe: 'response'}});
  }

  // tslint:disable-next-line:typedef
  options(path, cached = false) {
    const md5 = new Md5();

    let url = `${environment.api}${path}`;
    url = (url.indexOf('?') > -1) ? url : url + '/';
    const key = String(md5.appendStr(`options:${path}`).end());
    return (cached && this.cache.hasValidKey(key)) ? this.cache.get(key) : this.http.options(url, this.httpOptions)
      .pipe(map(data => {
        if (cached) {
          this.cache.set(key, data, 600000);
        }
        return data;
      }));
  }

  // tslint:disable-next-line:typedef
  delete(path: string, full = false) {
    const url = (!full) ? `${environment.api}${path}/` : path;
    return this.http.delete(url, this.httpOptions);
  }



}
