# Cambios necesarios para Pagos PAX temporales

## Resumen
Los pagos PAX ahora se manejan de forma temporal. Solo se crean/actualizan/eliminan en la base de datos al guardar la liquidación.

## Cambios realizados:

### 1. Interfaz PagoPaxTemp creada ✅
```typescript
interface PagoPaxTemp {
  id?: number; // Si tiene id, ya existe en BD; si no, es nuevo
  monto: number;
  moneda: string;
  moneda: string;
  detalle?: string;
  formaPagoId?: number;
  formaPago?: FormaPagoResponse;
  creado?: string;
  actualizado?: string;
  isTemporary?: boolean; // true si es nuevo y no está en BD
}
```

### 2. Propiedades actualizadas ✅
```typescript
pagosPax: PagoPaxTemp[] = [];
pagosPaxEliminados: number[] = []; // IDs de pagos PAX a eliminar al guardar
pagoPaxEditandoIndex: number | null = null; // Índice del pago que se está editando
```

### 3. Método loadPagosPax actualizado ✅
Convierte PagoPaxResponse a PagoPaxTemp al cargar

### 4. Métodos que necesitan actualización:

#### editarPagoPax - CAMBIAR FIRMA
```typescript
// Cambiar de:
editarPagoPax(pago: PagoPaxResponse): void

// A:
editarPagoPax(index: number): void {
  const pago = this.pagosPax[index];
  if (!pago) return;
  
  this.mostrandoFormularioPagoPax = true;
  this.pagoPaxEditandoIndex = index;
  this.pagoPaxForm.patchValue({
    monto: pago.monto,
    moneda: pago.moneda || 'USD',
    detalle: pago.detalle || '',
    formaPagoId: pago.formaPagoId || null
  });
}
```

#### guardarEdicionPagoPax - ACTUALIZAR
```typescript
guardarEdicionPagoPax(): void {
  if (this.pagoPaxEditandoIndex === null || this.pagoPaxForm.invalid) {
    return;
  }

  const formaPagoId = this.pagoPaxForm.value.formaPagoId;
  const formaPago = formaPagoId ? this.formasPago.find(fp => fp.id === formaPagoId) : undefined;

  // Actualizar el pago en el array local
  this.pagosPax[this.pagoPaxEditandoIndex] = {
    ...this.pagosPax[this.pagoPaxEditandoIndex],
    monto: this.pagoPaxForm.value.monto,
    moneda: this.pagoPaxForm.value.moneda || 'USD',
    detalle: this.pagoPaxForm.value.detalle,
    formaPagoId: formaPagoId,
    formaPago: formaPago
  };

  this.cerrarFormularioPagoPax();
  this.guardarEstadoTemporal();
}
```

#### eliminarPagoPax - CAMBIAR FIRMA
```typescript
// Cambiar de:
eliminarPagoPax(pago: PagoPaxResponse): void

// A:
eliminarPagoPax(index: number): void {
  const pago = this.pagosPax[index];
  if (!pago) return;

  if (!confirm('¿Está seguro de eliminar este pago PAX?')) {
    return;
  }

  // Si tiene ID, agregarlo a la lista de eliminados
  if (pago.id) {
    this.pagosPaxEliminados.push(pago.id);
  }

  // Eliminar del array local
  this.pagosPax.splice(index, 1);
  
  // Autoguardar estado temporal
  this.guardarEstadoTemporal();
}
```

#### cerrarFormularioPagoPax - ACTUALIZAR
```typescript
cerrarFormularioPagoPax(): void {
  this.mostrandoFormularioPagoPax = false;
  this.pagoPaxEditandoIndex = null; // Cambiar de pagoPaxEditando
  this.pagoPaxForm.reset({
    monto: 0,
    moneda: 'USD',
    detalle: '',
    formaPagoId: null
  });
}
```

### 5. Crear método procesarPagosPax (NUEVO)
```typescript
/**
 * Procesar pagos PAX: crear nuevos, actualizar existentes, eliminar marcados
 */
private async procesarPagosPax(liquidacionId: number): Promise<void> {
  try {
    // 1. Eliminar pagos marcados para eliminación
    if (this.pagosPaxEliminados.length > 0) {
      const deletePromises = this.pagosPaxEliminados.map(id =>
        this.pagoPaxService.delete(id).toPromise()
      );
      await Promise.all(deletePromises);
      this.pagosPaxEliminados = [];
    }

    // 2. Procesar cada pago PAX (crear o actualizar)
    for (const pago of this.pagosPax) {
      const pagoPaxRequest: PagoPaxRequest = {
        monto: pago.monto,
        moneda: pago.moneda,
        detalle: pago.detalle,
        liquidacionId: liquidacionId,
        formaPagoId: pago.formaPagoId!
      };

      if (pago.id && !pago.isTemporary) {
        // Actualizar existente
        await this.pagoPaxService.update(pago.id, pagoPaxRequest).toPromise();
      } else {
        // Crear nuevo
        const response = await this.pagoPaxService.create(pagoPaxRequest).toPromise();
        // Actualizar el pago con el ID recibido
        pago.id = response?.id;
        pago.isTemporary = false;
      }
    }
  } catch (error) {
    console.error('Error al procesar pagos PAX:', error);
    throw error;
  }
}
```

### 6. Actualizar guardarLiquidacion
Agregar después de guardar los detalles de liquidación:

```typescript
// Después de: await this.procesarDetallesLiquidacion(liquidacionResponse.id);
// Agregar:
await this.procesarPagosPax(liquidacionResponse.id);
```

### 7. Actualizar guardarEstadoTemporal
Agregar pagosPax y pagosPaxEliminados:

```typescript
const estadoTemporal = {
  liquidacionForm: this.liquidacionForm.value,
  detalleForm: this.detalleForm.value,
  detallesFijos: this.detallesFijos,
  detallesOriginales: this.liquidacion?.detalles || [],
  detallesEliminados: this.detallesEliminados,
  pagosPax: this.pagosPax, // AGREGAR
  pagosPaxEliminados: this.pagosPaxEliminados, // AGREGAR
  viajeroSearchTerms: this.viajeroSearchTerms,
  timestamp: new Date().getTime()
};
```

### 8. Actualizar cargarEstadoTemporal
Restaurar pagosPax y pagosPaxEliminados:

```typescript
if (estado.pagosPax) {
  this.pagosPax = estado.pagosPax;
}
if (estado.pagosPaxEliminados) {
  this.pagosPaxEliminados = estado.pagosPaxEliminados;
}
```

### 9. Actualizar limpiarEstadoTemporal
```typescript
this.pagosPaxEliminados = [];
this.pagosPax = [];
```

## Cambios en HTML:

### Cambiar botones de acciones en tabla de pagos PAX:
```html
<!-- Cambiar de: -->
<button (click)="editarPagoPax(pago)" ...>

<!-- A: -->
<button (click)="editarPagoPax(i)" ...>

<!-- Cambiar de: -->
<button (click)="eliminarPagoPax(pago)" ...>

<!-- A: -->
<button (click)="eliminarPagoPax(i)" ...>
```

### Actualizar trackBy:
```html
<!-- Cambiar de: -->
*ngFor="let pago of pagosPax; let i = index; trackBy: trackByPago"

<!-- A: -->
*ngFor="let pago of pagosPax; let i = index"
```

## Estado actual:
- ✅ Interfaz PagoPaxTemp creada
- ✅ Propiedades actualizadas
- ✅ loadPagosPax actualizado
- ✅ agregarPagoPax actualizado (agrega al array local)
- ⏳ editarPagoPax necesita actualización
- ⏳ guardarEdicionPagoPax necesita actualización  
- ⏳ eliminarPagoPax necesita actualización
- ⏳ cerrarFormularioPagoPax necesita actualización
- ⏳ Crear método procesarPagosPax
- ⏳ Actualizar guardarLiquidacion
- ⏳ Actualizar HTML
