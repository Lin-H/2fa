mod accounts;
mod barcode;
mod qr_clipboard;
mod totp;

#[tauri::command]
fn get_platform() -> String {
    if cfg!(target_os = "android") {
        "android".into()
    } else if cfg!(target_os = "ios") {
        "ios".into()
    } else {
        "desktop".into()
    }
}

#[tauri::command]
fn check_clipboard_qr() -> Result<Option<String>, String> {
    qr_clipboard::read_qr()
}

#[tauri::command]
fn save_account(
    app: tauri::AppHandle,
    issuer: String,
    label: String,
    secret: String,
) -> Result<(), String> {
    let account = accounts::Account {
        issuer,
        label,
        secret,
    };
    accounts::save(&app, account)
}

#[tauri::command]
fn load_accounts(app: tauri::AppHandle) -> Vec<accounts::Account> {
    accounts::load(&app)
}

#[tauri::command]
fn delete_account(app: tauri::AppHandle, index: usize) -> Result<(), String> {
    accounts::remove(&app, index)
}

#[tauri::command]
fn generate_totp_code(secret: String) -> Result<(String, u64), String> {
    totp::generate(&secret)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(barcode::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // 桌面端注册自动更新插件（移动端不支持自动更新）
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platform,
            check_clipboard_qr,
            save_account,
            load_accounts,
            delete_account,
            generate_totp_code,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
