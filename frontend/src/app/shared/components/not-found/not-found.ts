import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="text-center">
        <p class="text-8xl font-black text-indigo-600 mb-4">404</p>
        <h1 class="text-2xl font-bold text-gray-900 mb-3">Página no encontrada</h1>
        <p class="text-gray-500 mb-8 max-w-sm mx-auto">
          La página que buscas no existe o ha sido movida.
        </p>
        <a routerLink="/"
           class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Volver al inicio
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
