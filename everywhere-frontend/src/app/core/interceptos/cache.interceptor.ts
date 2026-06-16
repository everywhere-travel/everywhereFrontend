import { HttpInterceptorFn, HttpResponse, HttpRequest, HttpHandlerFn, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { CacheService } from '../service/cache.service';

/**
 * Token de contexto para deshabilitar la caché en peticiones específicas
 * Uso: new HttpContext().set(BYPASS_CACHE, true)
 */
export const BYPASS_CACHE = new HttpContextToken<boolean>(() => false);

/**
 * Token de contexto para especificar un TTL personalizado (en milisegundos)
 * Uso: new HttpContext().set(CACHE_TTL, 120000) // 2 minutos
 */
export const CACHE_TTL = new HttpContextToken<number>(() => 300000); // 5 minutos por defecto

/**
 * Interceptor de caché para Angular 17+
 *
 * Funcionalidades:
 * - Cachea automáticamente las peticiones GET
 * - Permite deshabilitar la caché mediante el contexto BYPASS_CACHE
 * - Permite configurar el TTL mediante el contexto CACHE_TTL
 * - Invalida automáticamente la caché en operaciones POST, PUT, PATCH, DELETE
 * - Se enfoca en los módulos: personas, liquidaciones, cotizaciones, documentos-cobranza
 *
 * @param req - Petición HTTP
 * @param next - Siguiente handler en la cadena
 * @returns Observable con la respuesta HTTP
 */
export const cacheInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const cacheService = inject(CacheService);

  // Verificar si la caché está deshabilitada para esta petición
  const bypassCache = req.context.get(BYPASS_CACHE);

  // Solo cachear peticiones GET
  if (req.method !== 'GET' || bypassCache) {
    // Para peticiones POST, PUT, PATCH, DELETE: invalidar la caché relacionada
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      invalidateCacheForUrl(req.url, cacheService);
    }
    return next(req);
  }

  // Verificar si la URL es de un módulo cacheable
  if (!isCacheableUrl(req.url)) {
    return next(req);
  }

  // Generar clave de caché basada en la URL y parámetros
  const cacheKey = generateCacheKey(req);

  // Intentar obtener la respuesta de la caché
  const cachedResponse = cacheService.get<HttpResponse<any>>(cacheKey);

  if (cachedResponse) {
    // Retornar la respuesta cacheada
    return of(cachedResponse.clone());
  }

  // Si no está en caché, hacer la petición y cachear la respuesta
  const ttl = req.context.get(CACHE_TTL);

  return next(req).pipe(
    tap(event => {
      // Solo cachear respuestas exitosas (HttpResponse)
      if (event instanceof HttpResponse) {
        cacheService.set(cacheKey, event.clone(), ttl);
      }
    })
  );
};

/**
 * Genera una clave única para la caché basada en la URL y parámetros
 * @param req - Petición HTTP
 * @returns Clave de caché
 */
function generateCacheKey(req: HttpRequest<any>): string {
  const url = req.urlWithParams;
  return url;
}

/**
 * Verifica si la URL pertenece a un módulo cacheable
 * Módulos cacheables: personas, liquidaciones, cotizaciones, documentos-cobranza
 * @param url - URL de la petición
 * @returns true si es cacheable, false en caso contrario
 */
function isCacheableUrl(url: string): boolean {
  const cacheableModules = [
    '/personas',
    '/liquidaciones',
    '/cotizaciones',
    '/documentos-cobranza',
    '/recibos'
  ];

  return cacheableModules.some(module => url.includes(module));
}

/**
 * Invalida la caché cuando se realizan operaciones que modifican datos
 * @param url - URL de la petición
 * @param cacheService - Servicio de caché
 */
function invalidateCacheForUrl(url: string, cacheService: CacheService): void {
  // Mapeo de URLs a módulos
  const moduleMap: Record<string, 'personas' | 'liquidaciones' | 'cotizaciones' | 'documentos-cobranza'> = {
    '/personas': 'personas',
    '/liquidaciones': 'liquidaciones',
    '/cotizaciones': 'cotizaciones',
    '/documentos-cobranza': 'documentos-cobranza'
  };

  // Buscar el módulo correspondiente
  for (const [pattern, module] of Object.entries(moduleMap)) {
    if (url.includes(pattern)) {
      cacheService.invalidateModule(module);
      break;
    }
  }
}
