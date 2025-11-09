import { Injectable } from '@angular/core';

/**
 * Interfaz que representa un elemento en caché con su valor y tiempo de expiración
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Servicio centralizado para gestionar el almacenamiento en memoria (In-Memory Cache)
 * Proporciona métodos para almacenar, recuperar e invalidar entradas de caché
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  /**
   * Almacén en memoria utilizando un Map para optimizar el rendimiento
   * Key: URL de la petición HTTP
   * Value: Entrada de caché con el valor y tiempo de expiración
   */
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * TTL predeterminado en milisegundos (1 minuto)
   */
  private readonly DEFAULT_TTL = 60000;

  constructor() {
    // Iniciar limpieza periódica cada 5 minutos para eliminar entradas expiradas
    this.startPeriodicCleanup();
  }

  /**
   * Almacena un valor en caché con un TTL específico
   * @param key Clave única (generalmente la URL de la petición)
   * @param value Valor a almacenar
   * @param ttl Tiempo de vida en milisegundos (opcional, usa DEFAULT_TTL si no se especifica)
   */
  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Recupera un valor de la caché si existe y no ha expirado
   * @param key Clave única
   * @returns El valor almacenado o null si no existe o ha expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si la entrada ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Invalida (elimina) una entrada específica de la caché
   * @param key Clave única a invalidar
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   * Útil para invalidar múltiples endpoints relacionados
   * @param pattern Patrón de búsqueda (puede ser una expresión regular o string)
   * @example invalidatePattern('/personas') // Invalida todas las URLs que contengan '/personas'
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia completamente la caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Verifica si existe una entrada en caché y no ha expirado
   * @param key Clave única
   * @returns true si existe y es válida, false en caso contrario
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Obtiene el número de entradas en caché (incluye las expiradas)
   * @returns Número de entradas
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Limpieza periódica de entradas expiradas para evitar fugas de memoria
   * Se ejecuta cada 5 minutos
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));

      if (keysToDelete.length > 0) {
        console.log(`[CacheService] Limpieza periódica: ${keysToDelete.length} entradas expiradas eliminadas`);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Invalida la caché de módulos específicos (personas, liquidaciones, cotizaciones, documento-cobranza)
   * Este método es útil después de operaciones CREATE, UPDATE o DELETE
   * @param module Nombre del módulo a invalidar
   */
  invalidateModule(module: 'personas' | 'liquidaciones' | 'cotizaciones' | 'documentos-cobranza' | 'all'): void {
    if (module === 'all') {
      this.clear();
      console.log('[CacheService] Toda la caché ha sido invalidada');
      return;
    }

    const patterns = {
      'personas': '/personas',
      'liquidaciones': '/liquidaciones',
      'cotizaciones': '/cotizaciones',
      'documentos-cobranza': '/documentos-cobranza'
    };

    const pattern = patterns[module];
    if (pattern) {
      this.invalidatePattern(pattern);
      console.log(`[CacheService] Caché del módulo '${module}' invalidada`);
    }
  }
}
