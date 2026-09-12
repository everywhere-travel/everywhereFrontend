import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import {
  AnalyticsDashboardDTO,
  AnalyticsService,
  DashboardFilters
} from '../../core/services/analytics.service';
import { EChartsOption } from 'echarts';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

@Component({
  selector: 'app-estadistica',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, FormsModule, NgxEchartsDirective, SidebarComponent],
  templateUrl: './estadistica.component.html',
  styleUrls: ['./estadistica.component.css']
})
export class EstadisticaComponent implements OnInit {

  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  data    = signal<AnalyticsDashboardDTO | null>(null);
  loading = signal<boolean>(true);

  // ─── Filtros ──────────────────────────────────────────────────────────────
  selectedPreset = '30';   // valor del preset (o '' si es custom)
  customStartDate = '';
  customEndDate   = '';
  showCustom      = false;
  isCustom        = false;

  // ─── Gráficos existentes ─────────────────────────────────────────────────
  salesChartOption:       EChartsOption = {};
  topVendorsOption:       EChartsOption = {};
  topProductsOption:      EChartsOption = {};
  topDestinationsOption:  EChartsOption = {};
  demographyOption:       EChartsOption = {};
  newClientsChartOption:  EChartsOption = {};

  // ─── Gráficos nuevos ─────────────────────────────────────────────────────
  funnelChartOption:      EChartsOption = {};
  gaugeChartOption:       EChartsOption = {};
  conversionVendorOption: EChartsOption = {};

  constructor(
    private analyticsService: AnalyticsService,
    private menuConfigService: MenuConfigService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/statistics');
    this.applyPreset('30');
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route && !item.children) this.router.navigate([item.route]);
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // ─── Filtros de período ───────────────────────────────────────────────────
  onPresetChange(days: string) {
    if (days === 'custom') {
      this.showCustom = true;
      this.isCustom   = true;
    } else {
      this.showCustom = false;
      this.isCustom   = false;
      this.applyPreset(days);
    }
  }

  applyPreset(days: string) {
    const end   = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days, 10));
    this.customStartDate = start.toISOString().split('T')[0];
    this.customEndDate   = end.toISOString().split('T')[0];
    this.loadData();
  }

  applyCustomRange() {
    if (this.customStartDate && this.customEndDate) {
      this.loadData();
    }
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────
  loadData() {
    this.loading.set(true);
    const filters: DashboardFilters = {
      startDate: this.customStartDate,
      endDate:   this.customEndDate
    };
    this.analyticsService.getDashboardData(filters).subscribe({
      next: (res) => {
        this.data.set(res);
        this.updateCharts(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dashboard', err);
        this.data.set(null);
        this.loading.set(false);
      }
    });
  }

  // ─── Construcción de gráficos ─────────────────────────────────────────────
  updateCharts(res: AnalyticsDashboardDTO) {
    this.buildSalesChart(res);
    this.buildTopVendors(res);
    this.buildTopProducts(res);
    this.buildTopDestinations(res);
    this.buildDemography(res);
    this.buildNewClients(res);
    // Nuevos
    this.buildFunnelChart(res);
    this.buildGaugeChart(res);
    this.buildConversionVendorChart(res);
  }

  // ─── Gráfico de Ingresos ──────────────────────────────────────────────────
  private buildSalesChart(res: AnalyticsDashboardDTO) {
    this.salesChartOption = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: res.salesChart.map(s => s.fecha) },
      yAxis: { type: 'value' },
      series: [{
        data: res.salesChart.map(s => s.monto),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(56, 189, 248, 0.5)' },
              { offset: 1, color: 'rgba(56, 189, 248, 0.05)' }
            ]
          }
        },
        itemStyle: { color: '#0ea5e9' }
      }]
    };
  }

  // ─── Top Vendedores ───────────────────────────────────────────────────────
  private buildTopVendors(res: AnalyticsDashboardDTO) {
    this.topVendorsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: res.topVendors.map(v => v.nombreVendedor).reverse() },
      series: [{
        name: 'Ventas ($)',
        type: 'bar',
        data: res.topVendors.map(v => v.montoVendido).reverse(),
        itemStyle: { color: '#8b5cf6' }
      }]
    };
  }

  // ─── Top Productos ────────────────────────────────────────────────────────
  private buildTopProducts(res: AnalyticsDashboardDTO) {
    this.topProductsOption = {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: res.topProducts.map(p => ({ name: p.nombreProducto, value: p.cantidadVendida }))
      }]
    };
  }

  // ─── Top Destinos ─────────────────────────────────────────────────────────
  private buildTopDestinations(res: AnalyticsDashboardDTO) {
    this.topDestinationsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
      yAxis: { type: 'category', data: res.topDestinations.map(d => d.destino).reverse(),
               axisLabel: { color: '#64748b' }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{
        name: 'Viajes', type: 'bar',
        data: res.topDestinations.map(d => d.cantidadViajes).reverse(),
        itemStyle: { color: '#14b8a6', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#0f766e' }
      }]
    };
  }

  // ─── Demografía ───────────────────────────────────────────────────────────
  private buildDemography(res: AnalyticsDashboardDTO) {
    this.demographyOption = {
      tooltip: { trigger: 'item' },
      legend: { type: 'scroll', bottom: '0%', left: 'center', padding: [0, 0, 15, 0] },
      series: [{
        name: 'Nacionalidad', type: 'pie', radius: ['35%', '60%'], center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: res.clientDemographics.map(d => ({ name: d.paisNacionalidad, value: d.cantidadClientes }))
      }]
    };
  }

  // ─── Nuevos Clientes ──────────────────────────────────────────────────────
  private buildNewClients(res: AnalyticsDashboardDTO) {
    this.newClientsChartOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: res.newClientsChart.map(d => d.fecha),
               axisLine: { lineStyle: { color: '#94a3b8' } } },
      yAxis: { type: 'value', axisLine: { show: false },
               splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, minInterval: 1 },
      series: [{
        name: 'Nuevos Clientes', type: 'line', smooth: true,
        data: res.newClientsChart.map(d => d.cantidad),
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
            ]
          }
        },
        symbolSize: 8, showSymbol: false
      }]
    };
  }

  // ─── NUEVO: Funnel de Conversión (barras horizontales estilo funnel) ────────
  private buildFunnelChart(res: AnalyticsDashboardDTO) {
    const f = res.quoteFunnel;
    if (!f) return;

    this.funnelChartOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
      series: [{
        type: 'funnel',
        left: '10%',
        width: '80%',
        sort: 'none',
        gap: 6,
        label: {
          show: true,
          position: 'inside',
          color: '#000000',
          fontWeight: 'bold',
          fontSize: 13,
          formatter: '{b}\n{c}'
        },
        labelLine: { show: false },
        itemStyle: { borderWidth: 0 },
        data: [
          { name: 'Cotizaciones Abiertas', value: f.totalCotizaciones },
          { name: 'Convertidas',         value: f.convertidas },
          { name: 'Vigentes sin cerrar',   value: f.cotizacionesVigentes },
          { name: 'Vencidas sin pagar',    value: f.cotizacionesVencidas }
        ]
      }]
    };
  }

  // ─── NUEVO: Gauge de Tasa de Conversión ──────────────────────────────────
  private buildGaugeChart(res: AnalyticsDashboardDTO) {
    const tasa = res.quoteFunnel?.tasaConversion ?? 0;
    this.gaugeChartOption = {
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0, max: 100,
        center: ['50%', '70%'],
        radius: '100%',
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.3, '#ef4444'],
              [0.6, '#f59e0b'],
              [0.85, '#10b981'],
              [1,   '#6366f1']
            ]
          }
        },
        pointer: { icon: 'path://M12.8,0.7l12.3,22.9H0.5L12.8,0.7z', length: '60%', width: 8, offsetCenter: [0, '-10%'], itemStyle: { color: '#1e293b' } },
        axisTick: { show: false },
        splitLine: { length: 10, lineStyle: { color: '#fff', width: 2 } },
        axisLabel: { show: true, distance: 8, color: '#94a3b8', fontSize: 11, formatter: (v: number) => v + '%' },
        title: { show: true, offsetCenter: [0, '15%'], color: '#64748b', fontSize: 13, fontWeight: 'normal' },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#1e293b',
          fontSize: 28,
          fontWeight: 'bold',
          offsetCenter: [0, '-10%']
        },
        data: [{ value: tasa, name: 'Tasa de Conversión' }]
      }]
    };
  }

  // ─── NUEVO: Conversión por Vendedor (barras apiladas) ─────────────────────
  private buildConversionVendorChart(res: AnalyticsDashboardDTO) {
    const vendors = res.conversionByVendor ?? [];
    const nombres = vendors.map(v => v.nombreVendedor);
    const conv    = vendors.map(v => v.cotizacionesConvertidas);
    const noConv  = vendors.map(v => v.totalCotizaciones - v.cotizacionesConvertidas);
    const tasas   = vendors.map(v => v.tasaConversion);

    this.conversionVendorOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          return `<b>${nombres[idx]}</b><br/>
            Convertidas: ${conv[idx]}<br/>
            No convertidas: ${noConv[idx]}<br/>
            Tasa: <b>${tasas[idx]}%</b>`;
        }
      },
      legend: { data: ['Convertidas', 'No Convertidas'], top: 8 },
      grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
      yAxis: { type: 'category', data: nombres.reverse(), axisLabel: { color: '#64748b' }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          name: 'Convertidas',
          type: 'bar',
          stack: 'total',
          data: conv.slice().reverse(),
          itemStyle: { color: '#10b981', borderRadius: [0, 0, 0, 0] },
          label: { show: true, position: 'inside', color: '#fff', fontWeight: 'bold',
                   formatter: (p: any) => p.value > 0 ? p.value : '' }
        },
        {
          name: 'No Convertidas',
          type: 'bar',
          stack: 'total',
          data: noConv.slice().reverse(),
          itemStyle: { color: '#fca5a5', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'inside', color: '#7f1d1d', fontWeight: 'bold',
                   formatter: (p: any) => p.value > 0 ? p.value : '' }
        }
      ]
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  getConversionColor(tasa: number): string {
    if (tasa >= 70) return 'text-emerald-600';
    if (tasa >= 40) return 'text-amber-500';
    return 'text-red-500';
  }

  getConversionBg(tasa: number): string {
    if (tasa >= 70) return 'bg-emerald-50 border-emerald-200';
    if (tasa >= 40) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  }

  getConversionBarColor(tasa: number): string {
    if (tasa >= 70) return '#10b981';
    if (tasa >= 40) return '#f59e0b';
    return '#ef4444';
  }
}
