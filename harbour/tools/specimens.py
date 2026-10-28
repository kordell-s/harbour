#!/usr/bin/env python3
"""Fictional passport specimens for testing Harbour's passport scan import.

  python3 tools/specimens.py samples
      Writes the demo scans to dist/samples/.

  python3 tools/specimens.py stamp IMAGE --surname S --given G --nationality GBR \
      --number AB1234567 --dob 1990-05-14 --sex F --expiry 2031-05-13 [--issuer GBR] [--box X0,Y0,X1,Y1]
      Overlays a valid machine-readable zone on an image (for example an AI-generated mock
      passport, whose generated MRZ text is usually not valid) and writes IMAGE-stamped.png
      next to it. --box gives the pixel rectangle of the garbled MRZ to cover; without it the
      zone is placed along the bottom of the image, which suits an image cropped to the data page.

Every person here is fictional. Each page carries a SPECIMEN watermark and a generic
design that does not reproduce any real country's passport.
"""
import argparse
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
MONO = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 38)
SANS = '/System/Library/Fonts/Helvetica.ttc'
font = lambda size: ImageFont.truetype(SANS, size)

COUNTRY_NAMES = {'GBR': 'United Kingdom', 'USA': 'United States', 'CAN': 'Canada', 'FRA': 'France', 'D': 'Germany',
                 'NLD': 'Netherlands', 'AUS': 'Australia', 'ITA': 'Italy', 'JAM': 'Jamaica'}


def check_digit(text):
    value = lambda c: 0 if c == '<' else int(c) if c.isdigit() else ord(c) - 55
    return str(sum(value(c) * (7, 3, 1)[i % 3] for i, c in enumerate(text)) % 10)


def mrz(surname, given, nationality, number, dob, sex, expiry, issuer=None):
    """Two-line TD3 machine-readable zone, matching buildMrz in manifest-import.js."""
    clean = lambda s: '<'.join(''.join(c for c in s.upper() if c.isalpha() or c == ' ').split())
    code = lambda c: (c + '<<<')[:3]
    line1 = ('P<' + code(issuer or nationality) + clean(surname) + '<<' + clean(given) + '<' * 44)[:44]
    doc = (number.upper() + '<' * 9)[:9]
    ymd = lambda d: d[2:].replace('-', '')
    body = doc + check_digit(doc) + code(nationality) + ymd(dob) + check_digit(ymd(dob)) + sex + ymd(expiry) + check_digit(ymd(expiry)) + '<' * 14 + '0'
    return line1, body + check_digit(body[:10] + body[13:20] + body[21:43])


PEOPLE = [
    dict(surname='Harrington', given='Olivia Rose', nationality='GBR', number='533190274', dob='1988-02-11', sex='F', expiry='2032-02-10', issued='2022-02-11', birthplace='Bristol'),
    dict(surname='Delgado', given='Marcus James', nationality='USA', number='A47812960', dob='1979-09-23', sex='M', expiry='2030-06-02', issued='2020-06-03', birthplace='San Diego, CA'),
    dict(surname='Tremblay', given='Sophie', nationality='CAN', number='GK482913', dob='1993-12-30', sex='F', expiry='2029-04-17', issued='2019-04-17', birthplace='Quebec City'),
    dict(surname='Moreau', given='Lucien Andre', nationality='FRA', number='19AE52831', dob='1984-07-04', sex='M', expiry='2031-11-21', issued='2021-11-22', birthplace='Lyon'),
    dict(surname='Becker', given='Hanna', nationality='D', number='C01X8R4K7', dob='2015-03-19', sex='F', expiry='2028-03-18', issued='2022-03-19', birthplace='Hamburg'),
    dict(surname='Van der Berg', given='Pieter', nationality='NLD', number='NX4KR81P2', dob='1969-10-08', sex='M', expiry='2026-03-01', issued='2016-03-02', birthplace='Utrecht'),
    dict(surname='Okafor', given='Daniel Chukwuma', nationality='AUS', number='PA8823104', dob='1990-05-14', sex='M', expiry='2033-08-29', issued='2023-08-30', birthplace='Melbourne'),
    dict(surname='Rossi', given='Giulia', nationality='ITA', number='YB2205918', dob='1996-01-27', sex='F', expiry='2034-02-05', issued='2024-02-06', birthplace='Genova'),
]


def data_page(p):
    """A generic passport data page with printed fields, a photo placeholder and the MRZ."""
    w, h = 1400, 980
    page = Image.new('RGB', (w, h), (236, 242, 240))
    d = ImageDraw.Draw(page)
    for y in range(0, h, 22):  # light guilloche-style background lines
        d.line([(0, y), (w, y + 60)], fill=(226, 234, 232), width=2)
    d.rectangle([0, 0, w, 96], fill=(30, 74, 86))
    d.text((40, 26), 'PASSPORT', font=font(40), fill='white')
    d.text((330, 36), f"{COUNTRY_NAMES[p['nationality']].upper()}  ·  SPECIMEN — NOT A TRAVEL DOCUMENT", font=font(24), fill=(206, 226, 224))
    d.rounded_rectangle([50, 140, 360, 540], 12, fill=(205, 214, 213))
    d.ellipse([140, 200, 270, 330], fill=(170, 182, 181))
    d.rounded_rectangle([110, 345, 300, 520], 60, fill=(170, 182, 181))
    rows = [('Type / Type', 'P'), ('Country code', p['nationality']), ('Passport No.', p['number']),
            ('Surname', p['surname'].upper()), ('Given names', p['given'].upper()), ('Nationality', COUNTRY_NAMES[p['nationality']].upper()),
            ('Date of birth', p['dob']), ('Sex', p['sex']), ('Place of birth', p['birthplace'].upper()),
            ('Date of issue', p['issued']), ('Date of expiry', p['expiry'])]
    x, y = 410, 130
    for i, (label, value) in enumerate(rows):
        col, row = divmod(i, 6)
        d.text((x + col * 470, y + row * 72), label, font=font(19), fill=(90, 108, 110))
        d.text((x + col * 470, y + row * 72 + 24), value, font=font(29), fill=(25, 40, 42))
    watermark = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(watermark).text((330, 360), 'SPECIMEN', font=font(150), fill=(200, 60, 70, 46))
    page.paste(Image.alpha_composite(page.convert('RGBA'), watermark.rotate(14, center=(w / 2, h / 2))).convert('RGB'))
    d = ImageDraw.Draw(page)
    d.rectangle([0, 790, w, h], fill=(246, 249, 248))
    for i, line in enumerate(mrz(p['surname'], p['given'], p['nationality'], p['number'], p['dob'], p['sex'], p['expiry'])):
        d.text((52, 818 + i * 64), line, font=MONO, fill=(18, 22, 24))
    return page


def scan(pages, rotate=0.0, background=(255, 255, 255), blur=0.6, noise=10, size=(1700, 2200), layout=None):
    """Place data pages on a sheet and degrade it like a flatbed scan or phone photo."""
    sheet = Image.new('RGB', size, background)
    for page, (x, y) in zip(pages, layout or [(150, 180)]):
        sheet.paste(page, (x, y))
    sheet = sheet.rotate(rotate, resample=Image.BICUBIC, expand=False, fillcolor=background)
    if blur:
        sheet = sheet.filter(ImageFilter.GaussianBlur(blur))
    if noise:
        grain = Image.effect_noise(size, noise).convert('RGB')
        sheet = Image.blend(sheet, grain, 0.06)
    return sheet


def smudge(page):
    """Smear part of the birth date in the MRZ so its check digit cannot be verified."""
    d = ImageDraw.Draw(page)
    x = 52 + 15 * 23  # date-of-birth digits on line 2 (Menlo 38px ≈ 23 px per character)
    d.ellipse([x - 8, 896, x + 42, 940], fill=(150, 150, 140))
    return page.filter(ImageFilter.GaussianBlur(0.4))


def samples():
    out = ROOT / 'dist' / 'samples'
    out.mkdir(parents=True, exist_ok=True)
    pages = [data_page(p) for p in PEOPLE]
    random.seed(7)
    pdf_pages = [
        scan([pages[0]], rotate=0.7),
        scan([pages[1], pages[2]], rotate=-0.5, layout=[(150, 120), (150, 1160)]),
        scan([pages[3]], rotate=180.4),
        scan([pages[4]], rotate=-1.1),
        scan([pages[5]], rotate=0.3),
    ]
    pdf_pages[0].save(out / 'sample-passport-scans.pdf', save_all=True, append_images=pdf_pages[1:], resolution=200)
    phone = Image.new('RGB', (1900, 1500), (92, 74, 58))
    phone.paste(pages[6].rotate(3, expand=True, fillcolor=(92, 74, 58)), (230, 210))
    shade = Image.linear_gradient('L').resize(phone.size).rotate(90)
    phone = Image.composite(phone, Image.new('RGB', phone.size, (40, 32, 26)), shade.point(lambda v: 150 + v // 3))
    phone.filter(ImageFilter.GaussianBlur(1.1)).save(out / 'sample-phone-photo.jpg', quality=82)
    scan([smudge(pages[7])], rotate=-0.4).save(out / 'sample-smudged-scan.jpg', quality=85)
    print('Wrote', ', '.join(sorted(f.name for f in out.iterdir())))


def stamp(args):
    image = Image.open(args.image).convert('RGB')
    line1, line2 = mrz(args.surname, args.given, args.nationality, args.number, args.dob, args.sex, args.expiry, args.issuer)
    if args.box:
        x0, y0, x1, y1 = (int(v) for v in args.box.split(','))
    else:
        x0, y0, x1, y1 = 0, None, image.width, image.height
    width = x1 - x0
    size = 10
    while ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', size + 1).getlength(line1) < width * 0.92:
        size += 1
    if y0 is None:
        y0 = y1 - int(size * 3.6)
    # Shrink the text if the box is too short for two lines at full width.
    while size > 8 and size * 3.2 > y1 - y0:
        size -= 1
    mono = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', size)
    d = ImageDraw.Draw(image)
    d.rectangle([x0, y0, x1, y1], fill=(246, 249, 248))
    top = y0 + max(0, (y1 - y0 - int(size * 2.75)) // 2)
    for i, line in enumerate((line1, line2)):
        d.text((x0 + int(width * 0.04), top + i * int(size * 1.55)), line, font=mono, fill=(18, 22, 24))
    target = Path(args.image).with_name(Path(args.image).stem + '-stamped.png')
    image.save(target)
    print('Wrote', target)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('samples')
    s = sub.add_parser('stamp')
    s.add_argument('image')
    for name in ('surname', 'given', 'nationality', 'number', 'dob', 'sex', 'expiry'):
        s.add_argument('--' + name, required=True)
    s.add_argument('--issuer')
    s.add_argument('--box', help='X0,Y0,X1,Y1 pixel rectangle covering the existing MRZ')
    args = parser.parse_args()
    samples() if args.command == 'samples' else stamp(args)
