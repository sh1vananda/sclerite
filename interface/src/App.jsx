import React, { useState, useRef, useMemo } from "react";
import {
  Upload,
  Download,
  Grid,
  Maximize,
  CornerDownRight,
  BoxSelect,
  Loader2,
} from "lucide-react";
import scleriteLogo from "./assets/logo.png";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

export default function EdgeMarkPro() {
  const [baseImage, setBaseImage] = useState(null);
  const [watermark, setWatermark] = useState(null);
  const [pattern, setPattern] = useState("center");
  const [opacity, setOpacity] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);

  const baseInputRef = useRef(null);
  const wmInputRef = useRef(null);

  // Exact pixel ratio calculation
  const scaleRatio = useMemo(() => {
    if (!baseImage || !watermark) return 0.15;
    return watermark.width / baseImage.width;
  }, [baseImage, watermark]);

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () =>
      setter({ file, url, width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleDownload = async () => {
    if (!baseImage || !watermark) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("image", baseImage.file);
    formData.append("watermark", watermark.file);
    formData.append("pattern", pattern);
    formData.append("opacity", opacity.toString());

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        body: formData,
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edgemark_${Date.now()}.png`;
      a.click();
    } catch (err) {
      alert("Worker connection failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPreviewStyle = () => {
    if (!watermark || !baseImage) return {};

    const url = `url(${watermark.url})`;
    const wmWidthPercent = (scaleRatio * 100).toFixed(2);

    const common = {
      opacity: opacity,
      backgroundRepeat: "no-repeat",
      transition: "all 0.2s ease-in-out",
    };

    switch (pattern) {
      case "tiled":
        return {
          ...common,
          backgroundImage: url,
          backgroundRepeat: "repeat",
          backgroundSize: `${(wmWidthPercent * 1.1).toFixed(2)}%`,
          backgroundPosition: "0 0",
        };

      case "diagonal":
        return {
          ...common,
          backgroundImage: `${url}, ${url}, ${url}`,
          backgroundSize: `${wmWidthPercent}%, ${wmWidthPercent}%, ${wmWidthPercent}%`,
          backgroundPosition: "0% 0%, 50% 50%, 100% 100%",
        };

      case "corners":
        return {
          ...common,
          backgroundImage: `${url}, ${url}, ${url}, ${url}`,
          backgroundSize: `${wmWidthPercent}%, ${wmWidthPercent}%, ${wmWidthPercent}%, ${wmWidthPercent}%`,
          backgroundPosition: "2% 2%, 98% 2%, 2% 98%, 98% 98%",
        };

      default: // center
        return {
          ...common,
          backgroundImage: url,
          backgroundSize: `${wmWidthPercent}%`,
          backgroundPosition: "center",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans antialiased selection:bg-white/10">
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <img
              src={scleriteLogo}
              alt="Sclerite Logo"
              className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] [image-rendering:antialiased]"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold tracking-tight text-sm uppercase italic">
              Sclerite<span className="text-zinc-600">-rs</span>
            </span>
            <span className="text-[8px] text-zinc-500 tracking-[0.3em] font-black uppercase">
              Watermarking
            </span>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={!baseImage || isProcessing}
          className="h-10 px-6 bg-white text-black rounded-full text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-10 flex items-center gap-2"
        >
          {isProcessing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Export
        </button>
      </nav>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        <aside className="w-full lg:w-80 border-r border-white/5 p-8 flex flex-col gap-10 bg-[#080808]">
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-5 flex items-center gap-2">
              Assets
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => baseInputRef.current.click()}
                className="w-full h-12 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all flex items-center px-4 gap-3 text-xs text-zinc-300"
              >
                <Upload size={14} className="text-zinc-600" />
                {baseImage ? "Update Image" : "Upload Image"}
              </button>
              <button
                onClick={() => wmInputRef.current.click()}
                className="w-full h-12 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all flex items-center px-4 gap-3 text-xs text-zinc-300"
              >
                <Upload size={14} className="text-zinc-600" />
                {watermark ? "Update Watermark" : "Upload Watermark"}
              </button>
              <input
                type="file"
                ref={baseInputRef}
                hidden
                onChange={(e) => handleFileChange(e, setBaseImage)}
              />
              <input
                type="file"
                ref={wmInputRef}
                hidden
                onChange={(e) => handleFileChange(e, setWatermark)}
              />
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-5 flex items-center gap-2">
              Layout
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "center", icon: <Maximize size={16} />, label: "Center" },
                { id: "tiled", icon: <Grid size={16} />, label: "Tiled" },
                {
                  id: "diagonal",
                  icon: <CornerDownRight size={16} />,
                  label: "Diagonal",
                },
                {
                  id: "corners",
                  icon: <BoxSelect size={16} />,
                  label: "Corners",
                },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPattern(p.id)}
                  className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${pattern === p.id ? "bg-white text-black border-white shadow-xl shadow-white/5" : "border-white/5 bg-black hover:border-white/10"}`}
                >
                  {p.icon}
                  <span className="text-[9px] font-bold uppercase tracking-tighter">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                Density
              </h2>
              <span className="text-[10px] font-mono text-white">
                {(opacity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-white cursor-pointer"
            />
          </section>
        </aside>

        <section className="flex-1 bg-black p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />

          {baseImage ? (
            <div className="relative inline-block group">
              <img
                src={baseImage.url}
                className="max-w-full max-h-[75vh] rounded shadow-2xl block border border-white/5"
                alt="Workspace"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={getPreviewStyle()}
              />
            </div>
          ) : (
            <div className="text-center opacity-10 flex flex-col items-center">
              <Upload size={48} className="mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em]">
                Empty Workspace
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
