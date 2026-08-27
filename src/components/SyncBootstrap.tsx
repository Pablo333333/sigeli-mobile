import { useSync } from '../hooks/useSync';

/**
 * Monta la sincronización automática de la cola offline
 * dentro del árbol autenticado.
 */
export function SyncBootstrap() {
  useSync();
  return null;
}
