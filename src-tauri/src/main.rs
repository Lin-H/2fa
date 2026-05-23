#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod accounts;
mod barcode;
mod qr_clipboard;
mod totp;

#[tauri::command]
fn check_clipboard_qr() -> Result<Option<String>, String> {
    qr_clipboard::read_qr()
}

#[tauri::command]
fn get_platform() -> String {
    if cfg!(target_os = "android") {
        "android"
    } else if cfg!(target_os = "ios") {
        "ios"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
    .to_string()
}

#[tauri::command]
fn save_account(app: tauri::AppHandle, issuer: String, label: String, secret: String) -> Result<(), String> {
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

fn main() {
    tauri::Builder::default()
        .plugin(barcode::init())
        .invoke_handler(tauri::generate_handler![
            check_clipboard_qr,
            get_platform,
            save_account,
            load_accounts,
            delete_account,
            generate_totp_code,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
