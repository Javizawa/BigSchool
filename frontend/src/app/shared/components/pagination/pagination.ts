import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="flex items-center justify-between mt-8">
      <p class="text-sm text-gray-600">
        Página {{ page() }} de {{ pages() }}
      </p>
      <div class="flex gap-2">
        <button
          (click)="pageChange.emit(page() - 1)"
          [disabled]="page() <= 1"
          class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
          ←
        </button>
        <button
          (click)="pageChange.emit(page() + 1)"
          [disabled]="page() >= pages()"
          class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
          →
        </button>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  page = input.required<number>();
  pages = input.required<number>();
  pageChange = output<number>();
}
