import {Component, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {Product, ProductRating, ProductService} from './product.service';
import {Observable, Subscription} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {MatMenuTrigger} from '@angular/material/menu';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;
  contextMenuPosition = {x: '0px', y: '0px'};

  productList$: Observable<Product[]>;
  productListRating$: Observable<ProductRating>;
  private productListRating: ProductRating;

  constructor(private productService: ProductService, private sanitizer: DomSanitizer) {
  }

  // tslint:disable-next-line:variable-name
  private _productList: Product[];

  get productList(): Product[] {
    return this._productList;
  }

  set productList(value: Product[]) {
    this._productList = value.sort((a, b) => (a.rating < b.rating) ? 1 : ((a.rating > b.rating) ? -1
        : ((a.id >= b.id) ? 1 : -1)
    ));
  }

  // sort()

  ngOnInit(): void {
    // const array: number[] = [4, 30, 21, 1, 1000];
    // console.log(array.sort((a, b) => (a >= b) ? 1 : -1));
    // console.log(array.sort());
    this.productListRating$ = this.productService.productListRating$.pipe(tap(rating => this.productListRating = rating));
    this.productList$ = this.productService.productList$.pipe(map(productList => Array.isArray(productList)
      ? productList.filter(product => !!product.categoryId).map(product => {
        product.picture = product.picture.replace('/800', `/seed/${product.name}${product.id}/1024`);
        return {
          ...product,
          ...{rating: (this.productListRating && this.productListRating[product.id]) ? this.productListRating[product.id].rating : 0}
        };
      })
      : []
    ), tap(productList => {
      this.productList = productList;
    }));

    setTimeout(() => {
      this.ratingSubscribe();
    }, 1);
  }

  postRating(product: Product, ratingValue: number, up: boolean): void {
    const rating = (up) ? ++ratingValue : --ratingValue;
    // console.log(rating);
    //
    // product = {...product, ...{rating}};
    // console.log(product);
    this.productService.postProduct({...product, ...{rating}});
  }

  openContextMenu($event: MouseEvent, product: Product): void {
    $event.preventDefault();
    console.log(this.contextMenu);
    this.contextMenuPosition.x = $event.clientX + 'px';
    this.contextMenuPosition.y = $event.clientY + 'px';
    this.contextMenu.menuData = {product};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  downloadPicture(product: Product): void {
    window.open(
      this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, this.sanitizer.bypassSecurityTrustResourceUrl(product.picture))
      , '_blank');
  }

  private ratingSubscribe(): void {
    console.log('ratingSubscribe');

    const subscription = new Subscription();

    subscription.add(this.productService.subscribeProduct$.subscribe(product => {
      this.productList = this.productList.map(currentProduct => {
        if (product.id === currentProduct.id) {
          currentProduct.rating = product.rating;
        }
        return currentProduct;
      });
      console.log('ratingSubscribe success');
      console.log(product.rating);
      subscription.unsubscribe();
      setTimeout(() => {
        this.ratingSubscribe();
      }, 1);
    }, error => {
      console.error('ratingSubscribe error');
      console.error(error);
      subscription.unsubscribe();
      setTimeout(() => {
        this.ratingSubscribe();
      }, 500);
    }));

  }
}
