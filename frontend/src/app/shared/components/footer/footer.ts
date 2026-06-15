import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-gray-900 text-gray-400 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 class="text-white font-bold mb-3">BigSchool</h4>
            <p class="text-sm">Tu tienda de zapatillas online. Las mejores marcas al mejor precio.</p>
          </div>
          <div>
            <h4 class="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Productos</h4>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/products" [queryParams]="{gender:'MEN'}" class="hover:text-white transition-colors">Hombre</a></li>
              <li><a routerLink="/products" [queryParams]="{gender:'WOMEN'}" class="hover:text-white transition-colors">Mujer</a></li>
              <li><a routerLink="/products" [queryParams]="{onSale:true}" class="hover:text-white transition-colors">Sale</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Ayuda</h4>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/size-guide" class="hover:text-white transition-colors">Guía de tallas</a></li>
              <li><a routerLink="/user/orders" class="hover:text-white transition-colors">Mis pedidos</a></li>
              <li><a routerLink="/user/addresses" class="hover:text-white transition-colors">Mis direcciones</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Newsletter</h4>
            <p class="text-sm mb-3">Recibe las últimas novedades y ofertas.</p>
            <a routerLink="/newsletter"
               class="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
              Suscribirme →
            </a>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-6 text-sm text-center">
          © {{ year }} BigSchool. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
