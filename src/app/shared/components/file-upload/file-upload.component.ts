import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <label *ngIf="label" class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {{ label }}
      </label>

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
            <span class="material-symbols-outlined text-[28px]">cloud_upload</span>
          </div>
          <div class="text-sm">
            <span class="font-semibold text-amber-600 dark:text-amber-400 hover:underline">Click to upload</span>
            <span class="text-slate-500 dark:text-slate-400"> or drag and drop</span>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            PNG, JPG, WEBP up to 5MB (Batch oil bottle packaging & lab test reports)
          </p>
        </div>
      </div>

      <!-- Thumbnails Preview -->
      <div *ngIf="previewImages && previewImages.length > 0" class="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
        <div *ngFor="let img of previewImages; let idx = index" class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <img [src]="img" alt="Uploaded file preview" class="w-full h-full object-cover" />
          <button
            type="button"
            (click)="removeImage(idx, $event)"
            class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <span class="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class FileUploadComponent {
  @Input() label?: string;
  @Input() accept: string = 'image/*';
  @Input() multiple: boolean = false;
  @Input() previewImages: string[] = [];

  @Output() filesChanged = new EventEmitter<string[]>();

  isDragging: boolean = false;

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
    }
  }

  private handleFileList(files: FileList): void {
    const newPreviews: string[] = [...this.previewImages];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        newPreviews.push(event.target.result);
        this.previewImages = [...newPreviews];
        this.filesChanged.emit(this.previewImages);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number, e: Event): void {
    e.stopPropagation();
    const updated = this.previewImages.filter((_, i) => i !== index);
    this.previewImages = updated;
    this.filesChanged.emit(updated);
  }
}
