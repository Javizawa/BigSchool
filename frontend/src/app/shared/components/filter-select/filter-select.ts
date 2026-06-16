import { Component, ElementRef, HostListener, inject, input, model, output, signal } from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filter-select',
  standalone: true,
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggle()"
        class="w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm bg-white transition-colors"
        [class]="open() ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-gray-200 hover:border-gray-300'"
      >
        <span [class]="hasValue() ? 'text-gray-900' : 'text-gray-400'">
          {{ selectedLabel() }}
        </span>
        <svg
          class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
          [class.rotate-180]="open()"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      @if (open()) {
        <div class="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
          <button type="button" (click)="select('')"
            class="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
            [class]="!hasValue() ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'">
            {{ placeholder() }}
            @if (!hasValue()) {
              <svg class="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            }
          </button>

          @for (opt of options(); track opt.value) {
            <button type="button" (click)="select(opt.value)"
              class="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
              [class]="value() === opt.value ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'">
              {{ opt.label }}
              @if (value() === opt.value) {
                <svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class FilterSelectComponent {
  readonly options = input<FilterOption[]>([]);
  readonly placeholder = input('Todos');
  readonly value = model<string | undefined>(undefined);
  readonly changed = output<string>();

  readonly open = signal(false);
  private readonly el = inject(ElementRef);

  selectedLabel() {
    const v = this.value();
    return (v ? this.options().find((o) => o.value === v)?.label : undefined) ?? this.placeholder();
  }

  hasValue() {
    return !!this.value();
  }

  toggle() {
    this.open.update((v) => !v);
  }

  select(value: string) {
    this.value.set(value || undefined);
    this.changed.emit(value);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event.target'])
  onOutsideClick(target: EventTarget | null) {
    if (!this.el.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }
}
