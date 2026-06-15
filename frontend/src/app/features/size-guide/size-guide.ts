import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';

interface SizeGuideEntry {
  eu: number;
  us: number;
  uk: number;
  cm: number;
}

interface SizeGuide {
  categoryId: string | null;
  categoryName: string | null;
  entries: SizeGuideEntry[];
}

@Component({
  selector: 'app-size-guide',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl font-black text-gray-900 mb-2">Guía de tallas</h1>
      <p class="text-gray-500 mb-10">Encuentra tu talla perfecta con nuestra tabla de conversión internacional.</p>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <app-spinner />
        </div>
      } @else if (guide()) {
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">EU</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">US</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">UK</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">CM</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (entry of guide()!.entries; track entry.eu) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-semibold text-gray-900">{{ entry.eu }}</td>
                    <td class="px-6 py-4 text-gray-600">{{ entry.us }}</td>
                    <td class="px-6 py-4 text-gray-600">{{ entry.uk }}</td>
                    <td class="px-6 py-4 text-gray-600">{{ entry.cm }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-8 bg-indigo-50 rounded-2xl p-6">
          <h2 class="font-semibold text-indigo-900 mb-2">¿Cómo medir tu pie?</h2>
          <ol class="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
            <li>Coloca el pie sobre una hoja de papel en el suelo.</li>
            <li>Traza el contorno del pie desde el talón hasta el dedo más largo.</li>
            <li>Mide la distancia en centímetros y consulta la tabla.</li>
            <li>Si estás entre dos tallas, elige la más grande.</li>
          </ol>
        </div>
      } @else {
        <p class="text-center text-gray-400 py-20">No se pudo cargar la guía de tallas.</p>
      }
    </div>
  `,
})
export class SizeGuidePage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly loading = signal(true);
  readonly guide = signal<SizeGuide | null>(null);

  ngOnInit(): void {
    this.http.get<SizeGuide>(`${environment.apiUrl}/size-guide`).subscribe({
      next: (data) => {
        this.guide.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
