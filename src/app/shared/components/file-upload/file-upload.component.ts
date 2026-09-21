import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label *ngIf="label" class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {{ label }}
        </label>
        <span *ngIf="isUploading()" class="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
          <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          <span>Uploading image to server...</span>
        </span>
      </div>

      <!-- Dropzone -->
      <div
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [ngClass]="{
          'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20': isDragging,
          'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/50': !isDragging
        }"
        class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          [accept]="accept"
          [multiple]="multiple"
          (change)="onFileSelected($event)"
          class="hidden"
        />

        <div class="flex flex-col items-center justify-center space-y-2">
          <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <span class="material-symbols-outlined text-[28px]">{{ isUploading() ? 'hourglass_top' : 'cloud_upload' }}</span>
          </div>
          <div class="text-sm">
            <span class="font-semibold text-amber-600 dark:text-amber-400 hover:underline">Click to upload photo</span>
            <span class="text-slate-500 dark:text-slate-400"> or drag and drop</span>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            JPG, PNG, WEBP up to 5MB (Saved directly to backend media storage)
          </p>
        </div>
      </div>

      <!-- Paste URL Option -->
      <div class="flex items-center gap-2 pt-1">
        <div class="relative flex-1">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">link</span>
          <input
            type="url"
            [(ngModel)]="manualUrl"
            (keydown.enter)="addManualUrl($event)"
            placeholder="Or paste external image link (e.g. https://... or Unsplash)"
            class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <button
          type="button"
          (click)="addManualUrl($event)"
          [disabled]="!manualUrl.trim()"
          class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40"
        >
          Add URL
        </button>
      </div>

      <!-- Thumbnails Preview -->
      <div *ngIf="previewImages && previewImages.length > 0" class="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
        <div *ngFor="let img of previewImages; let idx = index" class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
          <img
            [src]="resolveImage(img)"
            alt="Uploaded preview"
            class="w-full h-full object-cover"
            (error)="handleImgError($event)"
          />
          <button
            type="button"
            (click)="removeImage(idx, $event)"
            class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            title="Remove image"
          >
            <span class="material-symbols-outlined text-[14px]">close</span>
          </button>
          <div *ngIf="idx === 0" class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white uppercase tracking-wider">
            Primary
          </div>
        </div>
      </div>
    </div>
  `
})
export class FileUploadComponent {
  productService = inject(ProductService);

  @Input() label?: string;
  @Input() accept: string = 'image/*';
  @Input() multiple: boolean = false;
  @Input() previewImages: string[] = [];

  @Output() filesChanged = new EventEmitter<string[]>();

  isDragging: boolean = false;
  isUploading = signal<boolean>(false);
  manualUrl: string = '';

  resolveImage(url: string): string {
    return this.productService.resolveImageUrl(url);
  }

  handleImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80';
  }

  addManualUrl(e?: Event): void {
    if (e) e.preventDefault();
    const trimmed = this.manualUrl.trim();
    if (!trimmed) return;

    const updated = this.multiple ? [...this.previewImages, trimmed] : [trimmed];
    this.previewImages = updated;
    this.filesChanged.emit(updated);
    this.manualUrl = '';
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFileList(e.dataTransfer.files);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileList(input.files);
      input.value = '';
    }
  }

  private async handleFileList(files: FileList): Promise<void> {
    this.isUploading.set(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await this.productService.uploadProductImage(file);
        uploadedUrls.push(url);
      } catch (err: any) {
        console.warn('Direct upload failed, falling back:', err);
        // Fallback to data URL only if upload is completely unreachable
        try {
          const dataUrl = await this.readFileAsDataUrl(file);
          uploadedUrls.push(dataUrl);
        } catch {}
      }
    }

    const updated = this.multiple 
      ? [...this.previewImages, ...uploadedUrls] 
      : (uploadedUrls.length > 0 ? [uploadedUrls[0]] : this.previewImages);

    this.previewImages = updated;
    this.filesChanged.emit(this.previewImages);
    this.isUploading.set(false);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number, e: Event): void {
    e.stopPropagation();
    const updated = this.previewImages.filter((_, i) => i !== index);
    this.previewImages = updated;
    this.filesChanged.emit(updated);
  }
}
