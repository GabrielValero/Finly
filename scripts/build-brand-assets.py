"""Genera los íconos por defecto (forma y color por defecto del catálogo) a partir de assets/icons/mark-*.png."""
import json
from PIL import Image

cat = json.load(open('src/config/app-icons.json'))
shape = cat['defaultShape']
bg = next(c['background'] for c in cat['colors'] if c['id'] == cat['defaultColor'])
mark = Image.open(f'assets/icons/mark-{shape}.png').convert('RGBA')

def solid(color, size=1024):
    return Image.new('RGBA', (size, size), color)

icon = solid(bg); icon.alpha_composite(mark)
icon.convert('RGB').save('assets/icon.png')
mark.save('assets/android-icon-foreground.png')
# Monocromo (íconos temáticos de Android 13+): solo importa el alfa.
mono = Image.new('RGBA', mark.size, (255, 255, 255, 0)); white = Image.new('RGBA', mark.size, (255, 255, 255, 255))
mono = Image.composite(white, mono, mark.split()[3]); mono.save('assets/android-icon-monochrome.png')
mark.save('assets/splash-icon.png')
fav = solid(bg, 256); fav.alpha_composite(mark.resize((256, 256), Image.LANCZOS)); fav.convert('RGB').resize((48, 48), Image.LANCZOS).save('assets/favicon.png')
print('ok', shape, bg)
