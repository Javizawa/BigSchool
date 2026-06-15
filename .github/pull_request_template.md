## Descripción

<!-- Qué cambia y por qué. Referencia el issue/ticket si aplica. -->

Closes #

## Tipo de cambio

- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Refactoring (sin cambio funcional)
- [ ] Cambio de configuración / infraestructura
- [ ] Documentación

---

## Checklist

### Spec OpenAPI
- [ ] Si el PR añade, modifica o elimina un endpoint → `docs/openapi/openapi.yaml` está actualizado
- [ ] Si el PR cambia un concepto del proyecto → `.claude/CLAUDE.md` está actualizado

### Código
- [ ] El código sigue las convenciones del proyecto (ESLint + Prettier sin errores)
- [ ] No hay secrets, claves ni credenciales en el código

### Tests
- [ ] Los tests unitarios cubren el cambio
- [ ] Los tests de integración/E2E cubren el flujo afectado
- [ ] `npm run test` pasa en local sin errores

### Revisión
- [ ] El PR tiene un título que sigue Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- [ ] El PR tiene una descripción clara de qué cambia y por qué
