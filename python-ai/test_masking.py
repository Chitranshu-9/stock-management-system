import cv2
import numpy as np

def extract_canonical_crop(img_rgb, bbox_xyxy, mask_binary):
    x1, y1, x2, y2 = map(int, bbox_xyxy)
    if mask_binary is None:
        return img_rgb[y1:y2, x1:x2]
        
    mask_rs = cv2.resize(mask_binary, (img_rgb.shape[1], img_rgb.shape[0]))
    mask_rs = (mask_rs > 0.5).astype(np.uint8)
    
    isolated_img = img_rgb.copy()
    
    object_pixels = img_rgb[mask_rs > 0]
    if len(object_pixels) > 0:
        avg_color = np.mean(object_pixels, axis=0)
        avg_luminance = 0.2126 * avg_color[0] + 0.7152 * avg_color[1] + 0.0722 * avg_color[2]
        bg_color = [255, 255, 255] if avg_luminance < 50 else [0, 0, 0]
        print(f"Avg Lum: {avg_luminance:.2f} -> BG set to: {bg_color}")
    else:
        bg_color = [0, 0, 0]
        
    isolated_img[mask_rs == 0] = bg_color
    return isolated_img[y1:y2, x1:x2]

# Test Case 1: Pure Black Object (Remote)
img_black = np.zeros((100, 100, 3), dtype=np.uint8)
img_black[20:80, 20:80] = [10, 10, 10] # dark remote
mask = np.zeros((100, 100), dtype=np.uint8)
mask[20:80, 20:80] = 1

out1 = extract_canonical_crop(img_black, [20, 20, 80, 80], mask)
print("Test 1 Resulting Background Color:", out1[0, 0]) # Should be white [255, 255, 255] if mask edge has bg, but wait, crop is strictly [y1:y2, x1:x2] which is entirely inside the mask.
# Let's crop a bit larger to see the background!
out1 = extract_canonical_crop(img_black, [10, 10, 90, 90], mask)
print("Test 1 BG Color check (outside mask):", out1[0, 0])

# Test Case 2: Pure White Object (Paper)
img_white = np.zeros((100, 100, 3), dtype=np.uint8)
img_white[20:80, 20:80] = [240, 240, 240]
out2 = extract_canonical_crop(img_white, [10, 10, 90, 90], mask)
print("Test 2 BG Color check (outside mask):", out2[0, 0])
