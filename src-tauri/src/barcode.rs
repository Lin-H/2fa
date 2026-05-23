#[cfg(mobile)]
pub use tauri_plugin_barcode_scanner::init;

#[cfg(not(mobile))]
pub fn init<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("barcode-scanner").build()
}
