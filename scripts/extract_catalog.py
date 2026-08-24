#!/usr/bin/env python3
"""
Extrae imágenes y texto de un PDF de catálogo y genera `products.json`.

Uso:
    pip install -r requirements.txt
    python scripts/extract_catalog.py "CATALOGO  PERFUME POINT PRECIOS.pdf"

El script intenta heurísticamente detectar nombres y precios (L. 150, etc.) y asignar imágenes extraídas.
Revisa `products.json` luego y ajusta manualmente si es necesario.
"""

import fitz
import json
import os
import re
import sys


def save_image(img_dict, out_path):
    with open(out_path, 'wb') as f:
        f.write(img_dict['image'])


def extract_images(doc, out_dir):
    images = []
    for pageno in range(len(doc)):
        page = doc[pageno]
        imglist = page.get_images(full=True)
        for img_index, img in enumerate(imglist):
            xref = img[0]
            base_image = doc.extract_image(xref)
            ext = base_image.get('ext', 'png')
            fname = f'images/img_p{pageno+1}_{img_index}.{ext}'
            out_path = os.path.join(out_dir, os.path.basename(fname))
            save_image(base_image, out_path)
            images.append(out_path)
    return images


def extract_text_lines(doc):
    text = ''
    for page in doc:
        text += page.get_text('text') + '\n'
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return lines


PRICE_RE = re.compile(r'L\.?\s*\d+[\.,]?\d*')


def find_products_from_lines(lines):
    products = []
    used_idxs = set()
    for i, line in enumerate(lines):
        if PRICE_RE.search(line):
            # Heurística: nombre = línea anterior, descripción = línea anterior a la anterior
            name = lines[i-1] if i-1 >= 0 else 'Producto'
            desc = lines[i-2] if i-2 >= 0 else ''
            # Buscar hasta 2 precios en las líneas siguientes/inmediatas
            prices = []
            # incluir el price en la misma línea
            for p in PRICE_RE.findall(line):
                prices.append(p)
            # mirar siguientes 3 líneas
            for j in range(i+1, min(i+4, len(lines))):
                for p in PRICE_RE.findall(lines[j]):
                    prices.append(p)

            # normalizar precios (tomar hasta 3: full, 5ml, 10ml)
            prices = list(dict.fromkeys(prices))
            price_full = prices[0] if len(prices) > 0 else ''
            price_5 = prices[1] if len(prices) > 1 else ''
            price_10 = prices[2] if len(prices) > 2 else ''

            products.append({
                'name': name,
                'description': desc,
                'price_full': price_full,
                'price_5ml': price_5,
                'price_10ml': price_10,
                'image': ''
            })

    # Eliminar duplicados por nombre
    uniq = []
    seen = set()
    for p in products:
        key = p['name'] + '|' + p['price_full']
        if key in seen:
            continue
        seen.add(key)
        uniq.append(p)
    return uniq


def normalize_price_to_number(price_str):
    if not price_str:
        return None
    s = price_str.replace('L', '').replace('l', '').replace('.', '').replace(',', '.').strip()
    s = re.sub(r'[^0-9\.]', '', s)
    try:
        return float(s)
    except:
        return None


def main(pdf_path):
    if not os.path.isfile(pdf_path):
        print('Archivo no encontrado:', pdf_path)
        return

    doc = fitz.open(pdf_path)
    out_dir = os.path.dirname(pdf_path)

    print('Extrayendo imágenes...')
    images = extract_images(doc, out_dir)
    print(f'Imágenes extraídas: {len(images)}')

    print('Extrayendo texto y detectando productos...')
    lines = extract_text_lines(doc)
    products = find_products_from_lines(lines)

    # Asignar imágenes heurísticamente por orden si hay coincidencia
    if images and len(images) >= len(products):
        for i, p in enumerate(products):
            p['image'] = images[i]

    # Normalizar precios numéricos
    for p in products:
        p['price_full_num'] = normalize_price_to_number(p.get('price_full', ''))
        p['price_5ml_num'] = normalize_price_to_number(p.get('price_5ml', ''))
        p['price_10ml_num'] = normalize_price_to_number(p.get('price_10ml', ''))

    out_json = os.path.join(out_dir, 'products.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    # También guardar texto crudo para revisión
    with open(os.path.join(out_dir, 'catalog_text_raw.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print('Generado', out_json)
    print('Guarda también catalog_text_raw.txt para revisar la extracción de texto.')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python scripts/extract_catalog.py <ruta_al_pdf>')
    else:
        main(sys.argv[1])
