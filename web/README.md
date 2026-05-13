# Visor CAD Paramétrico

Web app estática para visualizar, modificar parámetros y exportar modelos CAD 3D hechos en JSCAD.

> **No requiere build ni dependencias.** Solo sirve la carpeta con cualquier servidor estático.

## Cómo usar

```bash
cd cad-viewer
python3 -m http.server 8080
# Abrir http://localhost:8080
```

O cualquier servidor estático (`npx serve .`, `php -S localhost:8080`, `bunx serve`, etc.).

## Funcionalidades

- **Visualización 3D** con Three.js, controles de órbita, gizmo, ejes y rejilla
- **Parámetros editables** desde el panel lateral
- **Exportación** a STL, AMF, DXF, OBJ, SVG, **3MF** (por defecto)
- **Modo oscuro** y toggles de ejes/rejilla

## Estructura

```
cad-viewer/
├── index.html       # Página principal
├── main.js          # App bundleada con viewer, orbit, export
├── model.js         # Tu modelo paramétrico (referencia)
├── build/           # Bundles de jscadui (worker, threejs, modeling, io)
└── examples/        # Ejemplos
```

## Editar el modelo

El modelo por defecto está embebido en `main.js`. Para cambiarlo, edita `examples/jscad.example.js` y **rehace el build** desde `jscadui/apps/jscad-web`.

O usa el hash URL para cargar un script externo:
```
http://localhost:8080#./model.js
```

## Desplegar

Sube toda la carpeta `cad-viewer/` a cualquier hosting estático:
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

## Licencia

MIT
