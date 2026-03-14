use worker::*;

mod engine;

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    // 1. Initialize Global CORS Headers
    let headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Content-Type")?;

    // 2. Immediate Pre-flight (OPTIONS) Response
    if req.method() == Method::Options {
        return Ok(Response::empty()?.with_headers(headers));
    }

    let router = Router::new();

    // 3. Routing Logic
    let res = router
        .post_async("/watermark", |mut req, _ctx| async move {
            let form = match req.form_data().await {
                Ok(f) => f,
                Err(_) => return Response::error("Multipart form parse error", 400),
            };

            // Extraction
            let base_file = match form.get("image") {
                Some(FormEntry::File(f)) => f,
                _ => return Response::error("Base image missing", 400),
            };

            let watermark_file = match form.get("watermark") {
                Some(FormEntry::File(f)) => f,
                _ => return Response::error("Watermark missing", 400),
            };

            let pattern = form
                .get("pattern")
                .and_then(|p| {
                    if let FormEntry::Field(s) = p {
                        Some(s)
                    } else {
                        None
                    }
                })
                .unwrap_or_else(|| "center".to_string());

            let opacity = form
                .get("opacity")
                .and_then(|o| {
                    if let FormEntry::Field(s) = o {
                        s.parse::<f32>().ok()
                    } else {
                        None
                    }
                })
                .unwrap_or(1.0);

            // Conversion to Bytes
            let base_bytes = base_file.bytes().await?;
            let wm_bytes = watermark_file.bytes().await?;

            // Engine Execution
            match engine::process_watermark(base_bytes, wm_bytes, &pattern, opacity) {
                Ok(output_bytes) => Response::from_bytes(output_bytes),
                Err(e) => Response::error(format!("Engine error: {}", e), 500),
            }
        })
        .run(req, env)
        .await;

    // 4. Global Response Mapping
    res.map(|r| {
        if r.status_code() == 200 {
            let _ = headers.set("Content-Type", "image/png");
        }
        r.with_headers(headers)
    })
}
