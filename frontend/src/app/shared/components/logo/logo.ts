import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="flex items-center gap-2.5">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 44" class="h-8 w-auto" aria-hidden="true">
        <!-- Sole -->
        <rect x="4" y="35" width="56" height="7" rx="3.5" fill="#312e81"/>
        <!-- Midsole -->
        <rect x="5" y="32" width="54" height="4" rx="2" fill="#4338ca"/>
        <!-- Upper body -->
        <path d="M 8 35 L 10 17 Q 12 9 22 7 L 44 3 Q 56 1 60 12 L 62 27 Q 63 32 60 35 Z" fill="#4f46e5"/>
        <!-- Toe cap -->
        <path d="M 8 35 L 10 17 C 7 17 4 28 4 35 Z" fill="#6366f1"/>
        <!-- Tongue -->
        <path d="M 32 5 C 30 16 30 26 32 35 L 36 35 C 38 26 38 16 36 5 Q 34 3 32 5 Z" fill="#6366f1"/>
        <!-- Laces -->
        <line x1="24" y1="18" x2="47" y2="13" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <line x1="23" y1="22" x2="45" y2="18" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <line x1="22" y1="27" x2="43" y2="22.5" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <!-- Heel tab -->
        <path d="M 60 35 L 60 18 Q 64 21 64 28 L 63 35 Z" fill="#818cf8"/>
      </svg>

      @if (admin()) {
        <div>
          <p class="text-base font-black leading-none">
            <span class="text-white">Love4</span><span class="text-indigo-400">Sneakers</span>
          </p>
          <p class="text-xs text-gray-500 mt-0.5 leading-none">Panel de administración</p>
        </div>
      } @else {
        <span class="text-xl font-black tracking-tight leading-none">
          <span [class]="darkText() ? 'text-white' : 'text-indigo-600'">Love4</span><span [class]="darkText() ? 'text-indigo-400' : 'text-gray-900'">Sneakers</span>
        </span>
      }
    </div>
  `,
})
export class LogoComponent {
  admin = input(false);
  darkText = input(false);
}
