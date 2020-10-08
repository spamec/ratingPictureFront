import {Injectable} from '@angular/core';
import {ApiService} from '../../services/api.service';
import {Observable, Subscription} from 'rxjs';

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  picture: string;
  rating?: number;
}

export interface ProductRating {
  [key: number]: Product;
}


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private api: ApiService) {
  }

  get productListRating$(): Observable<ProductRating> {
    return this.api.get<ProductRating>('/products/rating/');
  }

  get productList$(): Observable<Product[]> {
    return this.api.get<Product[]>('/products/');
  }

  get subscribeProduct$(): Observable<Product> {
    return this.api.get<Product>('/product/subscribe/');
  }

  /*onLoadComplete(e): void {
    console.log(e);
  }*/

  /*open<T>(path, full = false): Subject<T> {
    const response = new Subject<T>();
    const url = (!full) ? `${environment.api}${path}` : path;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = this.onLoadComplete;
    xhr.onerror = xhr.onabort = () => {
      console.log('onerror');
      response.error(false);
    };

    xhr.send('');
    return response;

  }*/


  postProduct(product: Product): void {
    const subscription = new Subscription();
    subscription.add(this.api.post<Product>('/product/update', product).subscribe(() => {
        // console.log(data.status);

        subscription.unsubscribe();
      }, e => {
        console.error(e.message);
        console.error(e.error);
        subscription.unsubscribe();
      })
    );
  }
}
