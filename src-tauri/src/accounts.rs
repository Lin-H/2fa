use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub issuer: String,
    pub label: String,
    pub secret: String,
}

fn accounts_path(app: &tauri::AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("Failed to get app data directory");
    dir.join("accounts.json")
}

pub fn load(app: &tauri::AppHandle) -> Vec<Account> {
    let path = accounts_path(app);
    if !path.exists() {
        return Vec::new();
    }
    fs::read_to_string(&path)
        .ok()
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default()
}

pub fn save(app: &tauri::AppHandle, account: Account) -> Result<(), String> {
    let mut accounts = load(app);
    accounts.push(account);
    let path = accounts_path(app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(&accounts).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

pub fn remove(app: &tauri::AppHandle, index: usize) -> Result<(), String> {
    let mut accounts = load(app);
    if index >= accounts.len() {
        return Err("Index out of range".to_string());
    }
    accounts.remove(index);
    let data = serde_json::to_string_pretty(&accounts).map_err(|e| e.to_string())?;
    fs::write(accounts_path(app), data).map_err(|e| e.to_string())
}
