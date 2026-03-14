use worker::*;

mod engine;

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let router = Router::new();

    router
        .post_async("/watermark", |mut req, _ctx| async move {
            let form = req.form_data().await?;

            // 1. Parameter Extraction
            let base_file = match form.get("image") {
                Some(FormEntry::File(f)) => f,
                _ => return Response::error("Base image missing", 400),
            };

            let watermark_file = match form.get("watermark") {
                Some(FormEntry::File(f)) => f,
                _ => return Response::error("Watermark missing", 400),
            };

            let pattern = form.get("pattern")
                .and_then(|p| if let FormEntry::Field(s) = p { Some(s) } else { None })
                .unwrap_or_else(|| "center".to_string());

            let opacity = form.get("opacity")
                .and_then(|o| if let FormEntry::Field(s) = o { s.parse::<f32>().ok() } else { None })
                .unwrap_or(1.0);

            // 2. Read Bytes
            let base_bytes = base_file.bytes().await?;
            let wm_bytes = watermark_file.bytes().await?;

            // 3. Process through Engine
            match engine::process_watermark(base_bytes, wm_bytes, &pattern, opacity) {
                Ok(output_bytes) => {
                    let headers = Headers::new();
                    headers.set("Content-Type", "image/png")?;
                    headers.set("Access-Control-Allow-Origin", "*")?;
                    Ok(Response::from_bytes(output_bytes)?.with_headers(headers))
                },
                Err(e) => Response::error(e.to_string(), 500),
            }
        })
        .options("/watermark", |_req, _ctx| {
            let headers = Headers::new();
            headers.set("Access-Control-Allow-Origin", "*")?;
            headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")?;
            headers.set("Access-Control-Allow-Headers", "Content-Type")?;
            Ok(Response::empty()?.with_headers(headers))
        })
        .run(req, env)
        .await
}