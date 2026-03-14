use photon_rs::{PhotonImage, multiple, native};
use worker::*;

pub fn process_watermark(
    base_image_bytes: Vec<u8>,
    watermark_bytes: Vec<u8>,
    pattern: &str,
    opacity: f32,
) -> Result<Vec<u8>> {
    // 1. Load images into WASM memory
    let mut base_img = native::open_image_from_bytes(&base_image_bytes)
        .map_err(|e| Error::from(format!("Failed to open base image: {:?}", e)))?;

    let mut watermark_img = native::open_image_from_bytes(&watermark_bytes)
        .map_err(|e| Error::from(format!("Failed to open watermark: {:?}", e)))?;

    // 2. Hitting the RGBA buffer directly.
    if opacity < 1.0 {
        let mut pixels = watermark_img.get_raw_pixels();

        // start at index 3 (the first alpha byte) and step by 4.
        for i in (3..pixels.len()).step_by(4) {
            // NewAlpha = CurrentAlpha * TargetOpacity
            pixels[i] = (pixels[i] as f32 * opacity) as u8;
        }

        // Reconstruct the PhotonImage with the modified buffer
        watermark_img = PhotonImage::new(pixels, watermark_img.get_width(), watermark_img.get_height());
    }

    // 3. Coordinate Dispatcher
    match pattern {
        "tiled" => apply_tiled_pattern(&mut base_img, &watermark_img),
        "diagonal" => apply_diagonal_repeat(&mut base_img, &watermark_img),
        "corners" => apply_four_corners(&mut base_img, &watermark_img),
        _ => apply_center_stamp(&mut base_img, &watermark_img),
    }

    // 4. Encode to bytes
    Ok(base_img.get_bytes())
}

fn apply_tiled_pattern(base: &mut PhotonImage, watermark: &PhotonImage) {
    let (b_w, b_h) = (base.get_width(), base.get_height());
    let (w_w, w_h) = (watermark.get_width(), watermark.get_height());

    // 30% padding to prevent the grid from feeling too "crowded"
    let padding = (w_w as f32 * 0.3) as u32;

    for y in (0..b_h).step_by((w_h + padding) as usize) {
        for x in (0..b_w).step_by((w_w + padding) as usize) {
            multiple::watermark(base, watermark, x as i64, y as i64);
        }
    }
}

fn apply_diagonal_repeat(base: &mut PhotonImage, watermark: &PhotonImage) {
    let (b_w, b_h) = (base.get_width(), base.get_height());
    let (w_w, w_h) = (watermark.get_width(), watermark.get_height());

    // Distribute 3 stamps along the main diagonal (25%, 50%, 75%)
    for i in 1..4 {
        let x = ((b_w * i) / 4).saturating_sub(w_w / 2);
        let y = ((b_h * i) / 4).saturating_sub(w_h / 2);
        multiple::watermark(base, watermark, x as i64, y as i64);
    }
}

fn apply_four_corners(base: &mut PhotonImage, watermark: &PhotonImage) {
    let (b_w, b_h) = (base.get_width(), base.get_height());
    let (w_w, w_h) = (watermark.get_width(), watermark.get_height());
    let p = 20u32; // 20px edge padding

    multiple::watermark(base, watermark, p as i64, p as i64);
    multiple::watermark(base, watermark, b_w.saturating_sub(w_w).saturating_sub(p) as i64, p as i64);
    multiple::watermark(base, watermark, p as i64, b_h.saturating_sub(w_h).saturating_sub(p) as i64);
    multiple::watermark(base, watermark, b_w.saturating_sub(w_w).saturating_sub(p) as i64, b_h.saturating_sub(w_h).saturating_sub(p) as i64);
}

fn apply_center_stamp(base: &mut PhotonImage, watermark: &PhotonImage) {
    let x = (base.get_width() / 2).saturating_sub(watermark.get_width() / 2);
    let y = (base.get_height() / 2).saturating_sub(watermark.get_height() / 2);
    multiple::watermark(base, watermark, x as i64, y as i64);
}