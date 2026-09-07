import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { AnalyticsDashboardDTO, AnalyticsService } from '../../core/services/analytics.service';
import { EChartsOption } from 'echarts';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

@Component({
  selector: 'app-estadistica',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, NgxEchartsDirective, SidebarComponent],
  templateUrl: './estadistica.component.html',
  styleUrls: ['./estadistica.component.css']
})
export class EstadisticaComponent implements OnInit {

  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  data = signal<AnalyticsDashboardDTO | null>(null);
  loading = signal<boolean>(true);

  salesChartOption: EChartsOption = {};
  topVendorsOption: EChartsOption = {};
  topProductsOption: EChartsOption = {};
  topDestinationsOption: EChartsOption = {};
  demographyOption: EChartsOption = {};
  newClientsChartOption: EChartsOption = {};

  constructor(
    private analyticsService: AnalyticsService,
    private menuConfigService: MenuConfigService,
    private router: Router
  ) { }

  ngOnInit() {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/statistics');
    this.loadData(30);
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route && !item.children) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const days = parseInt(select.value, 10);
    this.loadData(days);
  }

  loadData(days: number) {
    this.loading.set(true);
    
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    this.analyticsService.getDashboardData(startDate, endDate).subscribe({
      next: (res) => {
        this.data.set(res);
        this.updateCharts(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dashboard', err);
        this.loading.set(false);
      }
    });
  }

  updateCharts(res: AnalyticsDashboardDTO) {
    this.salesChartOption = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: res.salesChart.map(s => s.fecha)
      },
      yAxis: { type: 'value' },
      series: [{
        data: res.salesChart.map(s => s.monto),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(56, 189, 248, 0.5)' },
              { offset: 1, color: 'rgba(56, 189, 248, 0.1)' }
            ]
          }
        },
        itemStyle: { color: '#0ea5e9' }
      }]
    };

    this.topVendorsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: res.topVendors.map(v => v.nombreVendedor).reverse()
      },
      series: [{
        name: 'Ventas ($)',
        type: 'bar',
        data: res.topVendors.map(v => v.montoVendido).reverse(),
        itemStyle: { color: '#8b5cf6' }
      }]
    };

    this.topProductsOption = {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: res.topProducts.map(p => ({
          name: p.nombreProducto,
          value: p.cantidadVendida
        }))
      }]
    };
    
    // Gráfico de Top Destinos (Barras Horizontales)
    this.topDestinationsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'category',
        data: res.topDestinations.map(d => d.destino).reverse(),
        axisLabel: { color: '#64748b' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          name: 'Viajes',
          type: 'bar',
          data: res.topDestinations.map(d => d.cantidadViajes).reverse(),
          itemStyle: {
            color: '#14b8a6', // Teal
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#0f766e'
          }
        }
      ]
    };
    
    // Gráfico de Demografía (Nacionalidad)
    const demoData = res.clientDemographics.map(d => ({
      name: d.paisNacionalidad,
      value: d.cantidadClientes
    }));
    
    this.demographyOption = {
      tooltip: { trigger: 'item' },
      legend: { 
        type: 'scroll', 
        bottom: '0%', 
        left: 'center',
        padding: [0, 0, 15, 0]
      },
      series: [
        {
          name: 'Nacionalidad',
          type: 'pie',
          radius: ['35%', '60%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: '18', fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: demoData
        }
      ]
    };

    // Gráfico de Evolución de Clientes Nuevos
    this.newClientsChartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: res.newClientsChart.map(d => d.fecha),
        axisLine: { lineStyle: { color: '#94a3b8' } }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
        minInterval: 1
      },
      series: [
        {
          name: 'Nuevos Clientes',
          type: 'line',
          smooth: true,
          data: res.newClientsChart.map(d => d.cantidad),
          itemStyle: { color: '#8b5cf6' }, // Purple
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
              ]
            }
          },
          symbolSize: 8,
          showSymbol: false
        }
      ]
    };
  }
}
