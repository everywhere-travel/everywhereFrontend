import { test, expect } from '@playwright/test';

test.describe('Flujo de Venta E2E', () => {
  let idUnico: string;
  let nombreCliente: string;
  let codigoCotizacion = '';

  test.beforeEach(async ({ page }) => {
    // Escuchar logs de consola del navegador para debuggear
    page.on('console', msg => console.log(`[Browser Console]: ${msg.text()}`));
  });

  test.beforeAll(() => {
    idUnico = Date.now().toString().slice(-6);
    nombreCliente = `Cliente E2E ${idUnico}`;
  });

  test('Debe completar todo el proceso de venta exitosamente', async ({ page }) => {
    // 1. Iniciar sesión
    await test.step('1. Iniciar sesión', async () => {
      await page.goto('/auth/login');
      // En Playwright podemos usar getByRole y getByPlaceholder que son muy estables
      await page.getByPlaceholder('Ingrese su nombre de usuario').fill('admin@gmail.com');
      await page.getByPlaceholder('Ingrese su contraseña').fill('123456');
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
      
      // Verificamos que llegamos al dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('.dashboard-layout').first()).toBeVisible();
    });

    // 2. Registrar un cliente único
    await test.step(`2. Registrar cliente: ${nombreCliente}`, async () => {
      // Hacer clic en el módulo de Clientes en el Dashboard
      await page.locator('.module-card').filter({ has: page.getByRole('heading', { name: 'Clientes', exact: true }) }).click();
      await expect(page).toHaveURL(/\/people/);
      
      // Hacer clic en Nuevo Cliente
      await page.getByRole('button', { name: 'Nuevo Cliente' }).or(page.getByRole('button', { name: 'Nuevo' })).first().click();
      
      // Seleccionar Persona Natural en el modal
      await page.getByRole('button', { name: /Persona Natural/i }).click();
      
      // Llenar formulario (Datos básicos)
      await page.locator('input[formControlName="nombres"]').fill(nombreCliente);
      await page.locator('input[formControlName="apellidosPaterno"]').fill('Prueba');
      
      // Guardar
      await page.locator('button[type="submit"]').click();
      
      // Esperar a que se cree y redirija al detalle
      await expect(page).toHaveURL(/\/people\/detalle\/\d+/);
    });

    // 3. Crear una cotización para ese cliente
    await test.step('3. Crear cotización', async () => {
      // Navegar a Cotizaciones a través del menú lateral
      await page.getByRole('button', { name: 'Cotizaciones' }).or(page.locator('a[href*="/quotes"]')).first().click();
      await expect(page).toHaveURL(/\/quotes/);
      
      // Nueva Cotización
      await page.getByRole('button', { name: 'Nueva Cotización' }).or(page.getByRole('button', { name: 'Nueva' })).first().click();
      
      // Buscar cliente
      await page.getByPlaceholder(/Buscar cliente/i).fill(nombreCliente);
      // Seleccionar de la lista de resultados
      await page.locator('div').filter({ hasText: nombreCliente }).getByText(nombreCliente, { exact: false }).first().click();
      
      // Agregar servicio (Detalle fijo)
      await page.locator('select[formControlName="productoId"]').first().selectOption({ index: 1 });
      await page.locator('input[formControlName="cantidad"]').fill('1');
      await page.locator('input[formControlName="precioHistorico"]').fill('1500');
      
      // Click en el botón + para agregar (usando la clase específica del botón)
      await page.locator('button.from-purple-500:has(i.fa-plus)').first().click();
      
      // Guardar cotización y esperar la respuesta de red
      const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/cotizaciones') && res.request().method() === 'POST'),
        page.locator('button[type="submit"]').click()
      ]);
      
      const responseBody = await response.text();
      console.log('Backend response body:', responseBody);
      try {
        const json = JSON.parse(responseBody);
        codigoCotizacion = json.codigoCotizacion || '';
        console.log('Código de cotización extraído:', codigoCotizacion);
      } catch (e) {
        console.error('No se pudo parsear el JSON de la respuesta');
      }
      
      // Esperar a que salga el toast de éxito
      await expect(page.locator('.bg-green-500, .swal2-popup, .toast-success, .snack-bar-container, .alert-success')).toBeVisible({ timeout: 15000 });
    });

    // 4. Crear liquidación
    await test.step('4. Crear liquidación', async () => {
      await page.getByRole('button', { name: 'Liquidaciones' }).or(page.locator('a[href*="/settlements"]')).first().click();
      await expect(page).toHaveURL(/\/settlements/);
      
      await page.getByRole('button', { name: 'Nueva Liquidación' }).or(page.getByRole('button', { name: 'Nueva' })).first().click();
      
      // Buscar la cotización por el código extraído
      await page.getByPlaceholder(/Buscar por código, cliente/i).fill(codigoCotizacion || nombreCliente);
      await page.waitForTimeout(1000);
      
      const listText = await page.locator('.max-h-96').innerText();
      console.log('Opciones en modal:', listText);
      
      // Seleccionar la cotización de la lista y esperar a que cargue el detalle
      const [responseDetalle] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/con-detalles') && res.request().method() === 'GET'),
        page.locator('.max-h-96').locator('.cursor-pointer').first().click()
      ]);
      
      // Esperar a que redirija al detalle
      await expect(page).toHaveURL(/\/settlements\/detalle/);
      
      // Llenar datos principales requeridos de la liquidación
      await page.locator('input[formControlName="destino"]').fill('Miami, USA');
      
      // Proveedor y costo en el primer detalle generado
      await page.locator('select[formControlName="proveedorId"]').first().selectOption({ index: 1 });
      await page.locator('input[formControlName="costoTicket"]').first().fill('500');
      
      // Guardar liquidación
      await page.getByRole('button', { name: 'Guardar Liquidación' }).click();
      
      // En detalle-liquidacion.component.ts, guardarLiquidacion() oculta el botón Guardar
      // y muestra el botón "Editar" al salir de modo edición
      await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible({ timeout: 15000 });
    });
    
  });
});
