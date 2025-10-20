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

## Estructura del Proyecto

```
Chrono/
├── index.html          # Página principal de visualización
├── chart.js            # Lógica JavaScript para renderizar la carta
├── README.md           # Este archivo
├── scripts/
│   └── download_ics_data.py  # Script para descargar datos de ICS
└── data/
    ├── nalma.json      # Biozonas norteamericanas (27 zonas)
    ├── salma.json      # Biozonas sudamericanas (22 zonas)
    ├── elma.json       # Biozonas europeas (Paleógeno, Neógeno, Cuaternario)
    ├── alma.json       # Biozonas asiáticas (11 zonas)
    └── mp_zones.json   # Zonas MP del Paleógeno (30 zonas)
```

## Uso

### 1. Descargar datos de ICS (opcional)

```bash
cd scripts
python download_ics_data.py
```

Esto descargará el archivo `chart.ttl` del repositorio oficial de ICS en GitHub.

### 2. Abrir la visualización

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

### 3. Usar los filtros

- **Período**: Filtra por Cenozoico, Mesozoico, Paleozoico o todos
- **Biozonas**: Muestra todas las biozonas o solo un tipo específico

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

## Formato de Datos JSON

Cada archivo JSON de biozonas sigue esta estructura:

```json
[
  {
    "name": "Nombre de la biozona",
    "start_ma": 0.0,
    "end_ma": 5.0,
    "epoch": "Época/Etapa geológica"
  }
]
```

## Desarrollo

### Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Python 3.x (solo para descargar datos de ICS)

### Mejoras Futuras

- [ ] Parser para archivos TTL de ICS
- [ ] Integración completa de datos ICS en la visualización
- [ ] Escala temporal proporcional a las edades
- [ ] Colores específicos por era/período/época
- [ ] Zoom y navegación interactiva
- [ ] Exportación a PNG/SVG/PDF
- [ ] Búsqueda y resaltado de biozonas
- [ ] Información detallada en tooltips
- [ ] Comparación lado a lado de diferentes biozonas
- [ ] Sincronización con base de datos en línea

## Contribuciones

Este proyecto integra datos de:
- International Commission on Stratigraphy (ICS)
- Wikipedia (artículos de biozonas)
- Comunidad científica paleontológica

## Licencia

Los datos de ICS están disponibles bajo licencia abierta.
Los datos de Wikipedia están bajo licencia CC BY-SA.

Este software es de código abierto para uso académico y educativo.

## Contacto

Para preguntas, sugerencias o contribuciones, por favor abre un issue en el repositorio del proyecto.

---

**Última actualización**: 2025
**Versión**: 1.0.0
