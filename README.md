# Carta Cronostratigráfica Internacional con Biozonas

Proyecto para visualizar la escala temporal geológica de la ICS (International Commission on Stratigraphy) junto con biozonas de mamíferos terrestres de diferentes continentes.

## Características

- **Datos de ICS**: Escala cronoestratigráfica oficial actualizada
- **5 sistemas de biozonas**:
  - NALMA (North American Land Mammal Ages)
  - SALMA (South American Land Mammal Ages)
  - ELMA (European Land Mammal Ages)
  - ALMA (Asian Land Mammal Ages)
  - MP zones (Mammal Paleogene Zones)
- **Columnas Redimensionables**: Ajusta el ancho de las columnas manualmente o automáticamente
  - Redimensionamiento manual mediante drag & drop
  - Distribución automática basada en contenido
  - Anchos personalizados se mantienen en impresión

## Estructura del Proyecto

```
Chrono/
├── index.html          # Página principal de visualización
├── chart-renderer.js   # Lógica JavaScript para renderizar la carta
├── styles.css          # Estilos CSS para la visualización
├── README.md           # Este archivo
└── data/
    ├── nalma.json      # Biozonas norteamericanas (27 zonas)
    ├── salma.json      # Biozonas sudamericanas (22 zonas)
    ├── elma.json       # Biozonas europeas (Paleógeno, Neógeno, Cuaternario)
    ├── alma.json       # Biozonas asiáticas (11 zonas)
    └── mp_zones.json   # Zonas MP del Paleógeno (30 zonas)
```

## Uso


Esto descargará el archivo `chart.ttl` del repositorio oficial de ICS en GitHub.

### 1. Abrir la visualización

Simplemente abre `index.html` en tu navegador web:

```bash
# Opción 1: Abrir directamente
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# Opción 2: Servidor local con Python
python -m http.server 8000
# Luego visita: http://localhost:8000
```

### 2. Usar los filtros

- **Período**: Filtra por Cenozoico, Paleogeno, Neogeno + Cuaternario o ingresa un rango personalizado
- **Biozonas**: Muestra todas las biozonas o solo un tipo específico
- **Modo de escala**: Proporcional, logarítmica o filas iguales

### 3. Ajustar columnas

#### Redimensionamiento Manual
1. Posiciona el cursor en el borde derecho de cualquier encabezado de columna
2. El cursor cambiará a ↔️ (redimensionar)
3. Haz clic y arrastra para ajustar el ancho
4. Todas las columnas son redimensionables, incluyendo la última

#### Distribución Automática
1. Haz clic en el botón "📐 Distribuir columnas"
2. El sistema calculará automáticamente el ancho óptimo para cada columna basándose en:
   - El texto del encabezado
   - El contenido más largo visible en los datos actuales
   - Límites: mínimo 70px, máximo 350px
3. Ideal para optimizar el espacio según los datos visibles

#### Restaurar Anchos Predeterminados
- Haz clic en "↔️ Restablecer columnas" para volver a los anchos originales

**Nota**: Los anchos personalizados se mantienen durante la sesión y en la versión impresa. Ver `COLUMNAS_REDIMENSIONABLES.md` para más detalles.

## Fuentes de Datos

### ICS (International Commission on Stratigraphy)
- **Sitio web**: https://stratigraphy.org/chart
- **Repositorio GitHub**: https://github.com/i-c-stratigraphy/chart
- **Formato**: RDF/Turtle (TTL)

### Biozonas de Wikipedia

1. **NALMA**: https://en.wikipedia.org/wiki/North_American_land_mammal_age
   - 27 edades (21 Cenozoicas + 6 Cretácicas)
   - Rango: Saintaugustinean (0.004 Ma) → Aquilian (84.0 Ma)

2. **SALMA**: https://en.wikipedia.org/wiki/South_American_land_mammal_age
   - 22 edades (Paleoceno a Pleistoceno tardío)
   - Rango: Tiupampan (64.5 Ma) → Lujanian (0.011 Ma)

3. **ELMA**: https://en.wikipedia.org/wiki/European_land_mammal_age
   - Paleógeno: Cernaysian → Agenian
   - Neógeno: MN 1 → MN 17
   - Cuaternario: subdivisiones del Pleistoceno y Holoceno

4. **ALMA**: https://en.wikipedia.org/wiki/Asian_land_mammal_age
   - 11 edades (Paleoceno a Mioceno)
   - Rango: Gashatan (58.7 Ma) → Tabenbulakian (23.03 Ma)

5. **MP zones**: https://en.wikipedia.org/wiki/Mammal_Paleogene_zones
   - 30 zonas consecutivas
   - Rango: MP 1 (66.043 Ma) → MP 30 (23.03 Ma)


## Desarrollo


### Mejoras Futuras

- [ ] Zoom y navegación interactiva
- [ ] Búsqueda y resaltado de biozonas
- [ ] Información detallada en tooltips
- [ ] Persistencia de anchos de columnas en localStorage
- [ ] Presets de distribución de columnas (compacto, normal, extendido)
- [ ] Reordenamiento de columnas mediante drag & drop

## Documentación Adicional

- **COLUMNAS_REDIMENSIONABLES.md**: Guía completa sobre el sistema de columnas redimensionables
- **RESUMEN_IMPLEMENTACION.md**: Detalles técnicos de la implementación
- **DEMO_COLUMNAS.html**: Demostración interactiva de las funcionalidades de columnas

## Contribuciones

Este proyecto integra datos de:
- International Commission on Stratigraphy (ICS)
- Wikipedia (artículos de biozonas)

## Licencia

Los datos de ICS están disponibles bajo licencia abierta.
Los datos de Wikipedia están bajo licencia CC BY-SA.

Este software es de código abierto para uso académico y educativo.

## Contacto

Para preguntas, sugerencias o contribuciones, por favor abre un issue en el repositorio del proyecto.

---

**Última actualización**: Octubre 2025
**Versión**: 1.1.0 - Columnas Redimensionables
