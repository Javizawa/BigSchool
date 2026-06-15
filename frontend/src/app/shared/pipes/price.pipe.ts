import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  }
}
