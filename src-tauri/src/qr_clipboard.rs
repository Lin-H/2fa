use arboard::Clipboard;
use quircs::Quirc;

pub fn read_qr() -> Result<Option<String>, String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Cannot access clipboard: {}", e))?;

    let image_data = match clipboard.get_image() {
        Ok(img) => img,
        Err(_) => return Ok(None),
    };

    let width = image_data.width;
    let height = image_data.height;
    let bytes = image_data.bytes;

    // arboard returns BGRA format on Windows
    let gray: Vec<u8> = bytes
        .chunks(4)
        .map(|p| (0.299 * p[2] as f32 + 0.587 * p[1] as f32 + 0.114 * p[0] as f32) as u8)
        .collect();

    let mut quirc = Quirc::new();
    let codes = quirc.identify(width as usize, height as usize, &gray);

    for code in codes {
        let code = match code {
            Ok(c) => c,
            Err(_) => continue,
        };
        let payload = match code.decode() {
            Ok(p) => p,
            Err(_) => continue,
        };
        let text = String::from_utf8_lossy(&payload.payload).to_string();
        if !text.is_empty() {
            return Ok(Some(text));
        }
    }

    Ok(None)
}
