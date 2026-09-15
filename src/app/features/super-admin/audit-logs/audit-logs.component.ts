import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INITIAL_AUDIT_LOGS } from '../../../core/services/mock-data';
import { AuditLogItem } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, DataTableComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise Security & Audit Trail</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">Tamper-evident logs of administrative actions, Google Sheet pricing overrides, and tenant changes.</p>
      </div>

      <app-data-table
        [columns]="columns"
        [totalCount]="filteredLogs().length"
        [pageSize]="10"
        searchPlaceholder="Search by user, action, entity or IP..."
        (search)="onSearch($event)"
      >
        <ng-container table-rows>
          <tr *ngFor="let log of filteredLogs()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
              {{ log.timestamp }}
            </td>
            <td class="px-4 py-3">
              <div class="font-bold text-xs text-slate-900 dark:text-white">{{ log.userName }}</div>
              <div class="text-[10px] text-slate-400 font-mono">{{ log.role }}</div>
            </td>
            <td class="px-4 py-3">
              <app-badge [variant]="getActionVariant(log.action)">
                {{ log.action }}
              </app-badge>
            </td>
            <td class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
              {{ log.entity }}
              <span class="text-[10px] text-slate-400 font-mono">({{ log.entityId }})</span>
            </td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
              {{ log.details }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-[11px] text-slate-400">
              {{ log.ipAddress }}
            </td>
          </tr>
        </ng-container>
      </app-data-table>
    </div>
  `
})
export class AuditLogsComponent {
  logs = signal<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  searchQuery = signal<string>('');

  columns: ColumnDef[] = [
    { key: 'timestamp', label: 'Timestamp', sortable: true },
    { key: 'userName', label: 'User & Role', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'entity', label: 'Target Entity', sortable: true },
    { key: 'details', label: 'Operation Details' },
    { key: 'ipAddress', label: 'IP Address', align: 'right' }
  ];

  filteredLogs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.logs();
    return this.logs().filter(l =>
      l.userName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.ipAddress.includes(q)
    );
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  getActionVariant(action: string): 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate' {
    if (action.includes('CREATE') || action.includes('APPROVED')) return 'emerald';
    if (action.includes('UPDATE') || action.includes('ADJUST')) return 'blue';
    if (action.includes('DELETE') || action.includes('SUSPEND')) return 'rose';
    if (action.includes('PRICE') || action.includes('SYNC')) return 'amber';
    return 'slate';
  }
}
