"""Extrae las 8 marcas (la F) del collage de iconos y las deja como PNG 1024 con alfa (para recolorear).

Uso: python3 scripts/extract-icon-marks.py <collage.png> <carpeta_salida>
El collage es una cuadrícula 3x3; la casilla 9 es una lámina de proporción áurea, no un icono.
"""
import sys
import cv2
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
img = cv2.imread(SRC)  # BGR
H, W = img.shape[:2]
T = W // 3
CANVAS = 1024
# Lado máximo de la marca dentro del lienzo: la zona segura del icono adaptativo es el 66 % central.
TARGET = 540

# (columna, fila, nombre, afilado, quitar_trazos_finos)
TILES = [
    (0, 0, 'a', 6.0, False),
    (1, 0, 'b', 6.0, True),   # lleva líneas guía finas que no son parte de la marca
    (2, 0, 'c', 6.0, False),
    (0, 1, 'd', 6.0, False),
    (1, 1, 'e', 6.0, False),
    (2, 1, 'f', 3.0, False),  # dos tonos translúcidos: no endurecer el alfa
    (0, 2, 'g', 6.0, False),
    (1, 2, 'h', 6.0, False),
]

def smoothstep_sharpen(a, k):
    return np.clip((a - 0.5) * k + 0.5, 0, 1)

for col, row, name, k, strip_thin in TILES:
    M = 10  # margen: las casillas vecinas dejan líneas de borde de 1-2 px
    tile = img[row * T + M:(row + 1) * T - M, col * T + M:(col + 1) * T - M].astype(np.float32)
    # La marca ocupa la parte alta; el logotipo "finly" debajo se descarta.
    region = tile[: int(T * 0.62) - M]
    corners = np.concatenate([region[:12, :12].reshape(-1, 3), region[:12, -12:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    dist = np.linalg.norm(region - bg, axis=2)
    dist /= max(dist.max(), 1.0)
    if name == 'f':
        # Dos tonos: F sólida + hoja translúcida (≈45 %). Se fijan dos niveles limpios.
        dist = np.interp(dist, [0.0, 0.15, 0.30, 0.62, 0.80, 1.0], [0.0, 0.0, 0.45, 0.45, 1.0, 1.0]).astype(np.float32)
    if strip_thin:
        solid = (dist > 0.45).astype(np.uint8)
        solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
        solid = cv2.dilate(solid, np.ones((5, 5), np.uint8))
        dist *= solid
    ys, xs = np.where(dist > 0.25)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    glyph = dist[y0:y1, x0:x1]
    scale = TARGET / max(glyph.shape)
    big = cv2.resize(glyph, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 1.2)
    alpha = smoothstep_sharpen(np.clip(big, 0, 1), k)
    canvas = np.zeros((CANVAS, CANVAS), np.float32)
    h, w = alpha.shape
    oy, ox = (CANVAS - h) // 2, (CANVAS - w) // 2
    canvas[oy:oy + h, ox:ox + w] = alpha
    cream = np.array([230, 241, 251], np.float32)  # BGR de #FBF1E6
    rgba = np.dstack([np.full((CANVAS, CANVAS, 3), cream), canvas * 255]).astype(np.uint8)
    cv2.imwrite(f'{OUT}/mark-{name}.png', rgba)
    print(name, 'bg', bg.astype(int)[::-1], 'bbox', (x1 - x0, y1 - y0), 'scale', round(float(scale), 2))
