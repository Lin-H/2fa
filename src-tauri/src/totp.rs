use hmac::{Hmac, Mac};
use sha1::Sha1;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha1 = Hmac<Sha1>;

pub fn generate(secret_base32: &str) -> Result<(String, u64), String> {
    let secret =
        base32::decode(base32::Alphabet::Rfc4648 { padding: false }, secret_base32)
            .ok_or_else(|| "无效的 Base32 密钥".to_string())?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let period: u64 = 30;
    let counter = now / period;
    let remaining = period - (now % period);

    let mut mac = HmacSha1::new_from_slice(&secret).map_err(|e| e.to_string())?;
    mac.update(&counter.to_be_bytes());
    let result = mac.finalize().into_bytes();

    let offset = (result[19] & 0x0f) as usize;
    let code = ((result[offset] & 0x7f) as u32) << 24
        | (result[offset + 1] as u32) << 16
        | (result[offset + 2] as u32) << 8
        | (result[offset + 3] as u32);

    Ok((format!("{:06}", code % 1_000_000), remaining))
}
