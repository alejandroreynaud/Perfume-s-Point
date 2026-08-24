Extracción de catálogo desde PDF

1) Instala dependencias:

```bash
pip install -r requirements.txt
```

2) Ejecuta el extractor indicando el PDF:

```bash
python scripts/extract_catalog.py "CATALOGO  PERFUME POINT PRECIOS.pdf"
```

3) El script creará:
- `products.json` con los productos detectados (revisa y ajusta manualmente).
- imágenes extraídas en la carpeta `images/`.
- `catalog_text_raw.txt` con el texto plano extraído.

4) Luego abre `index.html` (mejor sirviéndolo con un servidor local, p.ej. `python -m http.server`) para que `script.js` pueda cargar `products.json`.
