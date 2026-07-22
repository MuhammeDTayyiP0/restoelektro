import os
from PIL import Image, ImageDraw, ImageFont

def create_gradient(width, height, color1, color2):
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        for x in range(width):
            mask_data.append(int(255 * (y / height)))
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def main():
    resources_dir = "resources"
    if not os.path.exists(resources_dir):
        os.makedirs(resources_dir)

    # Sidebar: 164x314
    sidebar = create_gradient(164, 314, (30, 41, 59), (15, 23, 42))  # Slate dark colors
    draw = ImageDraw.Draw(sidebar)
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 22)
        font_small = ImageFont.truetype("arial.ttf", 12)
    except IOError:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    draw.text((10, 20), "ETIBOL", fill=(255, 255, 255), font=font_large)
    draw.text((10, 45), "RESTO", fill=(56, 189, 248), font=font_large) # Light blue accent
    draw.text((10, 280), "Profesyonel", fill=(148, 163, 184), font=font_small)
    draw.text((10, 295), "POS Sistemi", fill=(148, 163, 184), font=font_small)
    
    sidebar.save(os.path.join(resources_dir, "installerSidebar.bmp"))

    # Header: 150x57
    header = Image.new('RGB', (150, 57), (15, 23, 42))
    draw_header = ImageDraw.Draw(header)
    draw_header.text((10, 10), "ETIBOL", fill=(255, 255, 255), font=font_large)
    draw_header.text((10, 32), "RESTO", fill=(56, 189, 248), font=font_small)
    
    header.save(os.path.join(resources_dir, "installerHeader.bmp"))

if __name__ == "__main__":
    main()
