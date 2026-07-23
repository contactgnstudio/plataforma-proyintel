# Fase 6 — Plantillas de Propuestas

## Descripción
Módulo para crear, gestionar y reutilizar **plantillas de propuestas** dentro de GN Studio OS.

## Archivos incluidos

| Archivo | Rol |
|---|---|
| `js/propuestas.js` | Módulo frontend (CRUD + previsualización) |
| `supabase/migrations/20260723_fase6_propuestas.sql` | Migración Supabase (tabla + RLS) |

## Tabla: `propuestas_plantillas`

```
id           uuid PK
user_id      uuid FK auth.users
nombre       text
descripcion  text
categoria    text  — branding | web | editorial | audiovisual | render | general
secciones    jsonb — [{key, label, contenido}]
created_at   timestamptz
updated_at   timestamptz
```

## Secciones predefinidas

1. Portada / Presentación
2. Alcance del Proyecto
3. Entregables
4. Inversión & Condiciones
5. Proceso de Trabajo
6. Cierre & CTA

## Integración con Cotizaciones

Cuando el usuario presiona **"Usar"** en una plantilla:
1. Navega a **Negocio > Cotizaciones**
2. Abre el formulario de nueva cotización
3. Pre-llena el campo `notas` con el contenido de las secciones
4. El usuario solo completa cliente, título y montos

## Cómo incluirlo en `index.html`

```html
<!-- En la sección Negocio, agregar nueva sub-sección -->
<section id="negocio-propuestas" data-section-id="propuestas" style="display:none;">
  <!-- Ver estructura completa en la sección HTML de la Fase 6 -->
</section>

<!-- Antes del cierre </body> -->
<script src="js/propuestas.js"></script>
```

## Estado
- [x] JS módulo completo
- [x] Migración SQL con RLS
- [ ] HTML sección en index.html (pendiente integración manual)
- [ ] Script de navegación (agregar ítem al menú lateral Negocio)
