import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarMenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  children?: SidebarMenuItem[];
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() menuItems: SidebarMenuItem[] = [];
  @Output() itemClick = new EventEmitter<SidebarMenuItem>();
  @Output() toggleSidebar = new EventEmitter<void>();

  expandedItems: Set<string> = new Set();

  onItemClick(item: SidebarMenuItem): void {
    if (item.children && item.children.length > 0) {
      this.toggleExpanded(item.id);
    } else {
      this.itemClick.emit(item);
    }
  }

  toggleExpanded(itemId: string): void {
    if (this.expandedItems.has(itemId)) {
      this.expandedItems.delete(itemId);
    } else {
      this.expandedItems.add(itemId);
    }
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItems.has(itemId);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
