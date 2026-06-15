import { Component, PLATFORM_ID, inject, model, signal, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    cloudinary: {
      openUploadWidget(
        options: Record<string, unknown>,
        callback: (
          error: Error | null,
          result: { event: string; info: { secure_url: string } },
        ) => void,
      ): void;
    };
  }
}

@Component({
  selector: 'app-cloudinary-upload',
  standalone: true,
  template: `
    <div class="space-y-2">
      @if (value()) {
        <div class="relative inline-block">
          <img
            [src]="thumb()"
            alt="Preview"
            class="w-24 h-24 object-cover rounded-xl border border-gray-200 bg-gray-50"
          />
          <button
            type="button"
            (click)="clear()"
            class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center leading-none transition-colors"
            aria-label="Eliminar imagen"
          >×</button>
        </div>
      }

      <button
        type="button"
        (click)="open()"
        [disabled]="uploading()"
        class="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 hover:border-indigo-400 text-sm text-gray-600 hover:text-indigo-600 rounded-xl transition-colors disabled:opacity-60"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {{ uploading() ? 'Subiendo...' : value() ? 'Cambiar imagen' : 'Subir imagen' }}
      </button>
    </div>
  `,
})
export class CloudinaryUploadComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  readonly value = model<string | null>(null);
  readonly uploading = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!document.getElementById('cloudinary-widget-script')) {
      const script = document.createElement('script');
      script.id = 'cloudinary-widget-script';
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      document.head.appendChild(script);
    }
  }

  open(): void {
    if (!window.cloudinary) return;
    this.uploading.set(true);

    window.cloudinary.openUploadWidget(
      {
        cloudName: environment.cloudinaryCloudName,
        uploadPreset: environment.cloudinaryUploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
        folder: 'bigschool/products',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5_000_000,
        styles: { palette: { action: '#4F46E5' } },
      },
      (error, result) => {
        if (error) {
          this.uploading.set(false);
          return;
        }
        if (result.event === 'success') {
          this.value.set(result.info.secure_url);
          this.uploading.set(false);
        }
        if (result.event === 'close') {
          this.uploading.set(false);
        }
      },
    );
  }

  clear(): void {
    this.value.set(null);
  }

  thumb(): string {
    const url = this.value();
    if (!url) return '';
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_160,h_160,c_fill/');
  }
}
