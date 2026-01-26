import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, Shield, Key, Zap, Image as ImageIcon, 
  FileText, ArrowRightLeft, RefreshCw, BarChart3, 
  CheckCircle, AlertCircle, Download
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8000";

export default function App() {
  const [mode, setMode] = useState('text'); // 'text' or 'image'
  const [view, setView] = useState('encode'); // 'encode' or 'decode'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Form States
  const [coverImg, setCoverImg] = useState(null);
  const [secretImg, setSecretImg] = useState(null);
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");

  const generateKey = () => {
    const randomKey = Math.random().toString(36).substring(2, 10).toUpperCase();
    setKey(randomKey);
  };

  const handleFileUpload = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
      setResult(null); // Reset result on new upload
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!coverImg) {
      setError("Please upload a cover image.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("key", key);
    formData.append("cover", coverImg);

    let endpoint = "";
    if (view === 'encode') {
      endpoint = mode === 'text' ? "/encode-text" : "/encode-image";
      if (mode === 'text') formData.append("message", message);
      else formData.append("secret", secretImg);
    } else {
      endpoint = mode === 'text' ? "/decode-text" : "/decode-image";
    }

    try {
      // Simulation for UI testing (Uncomment for demo)
      await new Promise(r => setTimeout(r, 1500));
      const fakeRes = { data: { stego_image: URL.createObjectURL(coverImg), recovered_image: URL.createObjectURL(coverImg), metrics: { psnr: 45.2, ssim: 0.98, bpp: 1.2, accuracy: 99.9 }, message: "This is a simulated decoded secret message." } };
      setResult(fakeRes.data);
      
      // Real Backend Call (Uncomment for production)
      // const res = await axios.post(`${API_BASE_URL}${endpoint}`, formData);
      // setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Error connecting to backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Outer container ensures full width and height with background color
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* Header - Stretches full width */}
      <header className="w-full bg-white border-b border-slate-200 py-6 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 flex items-center gap-3 tracking-tight">
              <Shield className="w-8 h-8 md:w-10 md:h-10 fill-indigo-100" /> DeepStego AI
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1 ml-1">Secure Steganography powered by DenseGAN & AES-256</p>
          </div>
          
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">v2.0 Beta</span>
          </div>
        </div>
      </header>

      {/* Main Content Area - constrained to max-w-7xl for standard widescreen look */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Controls (Takes 4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          
          {/* 1. Mode Switcher */}
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 flex">
            <button 
              onClick={() => {setMode('text'); setResult(null);}}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 ${mode === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText size={18} /> Text Hiding
            </button>
            <button 
              onClick={() => {setMode('image'); setResult(null);}}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 ${mode === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ImageIcon size={18} /> Image Hiding
            </button>
          </div>

          {/* 2. Encoder/Decoder Toggle */}
          <div className="relative bg-slate-200 rounded-full p-1 flex items-center cursor-pointer select-none h-12 shadow-inner">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${view === 'decode' ? 'translate-x-full ml-1' : 'translate-x-0'}`}
            />
            <button onClick={() => setView('encode')} className={`z-10 flex-1 text-sm font-bold text-center transition-colors ${view === 'encode' ? 'text-indigo-900' : 'text-slate-500'}`}>ENCODER</button>
            <button onClick={() => setView('decode')} className={`z-10 flex-1 text-sm font-bold text-center transition-colors ${view === 'decode' ? 'text-indigo-900' : 'text-slate-500'}`}>DECODER</button>
          </div>

          {/* 3. Input Form Card */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Zap className="text-amber-500 fill-current" size={20}/> 
                {view === 'encode' ? 'Configuration' : 'Extraction'}
              </h2>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Cover Image</label>
              <div className={`relative border-2 border-dashed rounded-xl h-32 flex items-center justify-center text-center transition-all duration-200 group ${coverImg ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                <input type="file" onChange={(e) => handleFileUpload(e, setCoverImg)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-indigo-600">
                  {coverImg ? (
                    <>
                      <CheckCircle className="text-green-500" size={28} />
                      <span className="text-xs font-medium text-slate-900 truncate max-w-[200px] px-2">{coverImg.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span className="text-xs font-medium">Upload Container</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Secret Data Input */}
            {view === 'encode' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {mode === 'text' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Secret Message</label>
                    <textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 h-24 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                      placeholder="Enter hidden text..."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Secret Image</label>
                    <div className={`relative border-2 border-dashed rounded-xl h-32 flex items-center justify-center transition-all ${secretImg ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400'}`}>
                        <input type="file" onChange={(e) => handleFileUpload(e, setSecretImg)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" />
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                            {secretImg ? <span className="text-indigo-700 font-medium text-xs">{secretImg.name}</span> : <><ImageIcon size={24}/><span className="text-xs">Upload Secret</span></>}
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Security Key</label>
                <button onClick={generateKey} type="button" className="text-xs text-indigo-600 font-bold hover:text-indigo-800 uppercase">
                  Auto-Gen
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="text-slate-400" size={16}/>
                </div>
                <input 
                  type="text" 
                  value={key} 
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm" 
                  placeholder="AES-256 Key"
                />
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}
              `}
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <ArrowRightLeft size={20} />}
              {view === 'encode' ? 'Encrypt & Hide' : 'Decrypt & Extract'}
            </button>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Results (Takes 8 cols - Wider) */}
        <div className="lg:col-span-8 w-full flex flex-col h-full min-h-[500px]">
          {!result ? (
            <div className="flex-1 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 min-h-[600px]">
              <div className="bg-white p-6 rounded-full mb-4 shadow-sm">
                <BarChart3 size={64} strokeWidth={1} className="text-slate-300" />
              </div>
              <p className="text-xl font-medium text-slate-500">Awaiting Input</p>
              <p className="text-sm mt-2">Processed images and metrics will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              {/* Output Image Card */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${view === 'encode' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                        <h3 className="text-base font-bold text-slate-700 uppercase tracking-wider">
                            {view === 'encode' ? 'Steganographic Output' : 'Recovered Content'}
                        </h3>
                    </div>
                    <a 
                      href={result.stego_image || result.recovered_image} 
                      download={`deepstego_result.png`}
                      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                    >
                      <Download size={18} /> Download
                    </a>
                </div>
                
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[400px]">
                    <img 
                        src={result.stego_image || result.recovered_image} 
                        alt="Result" 
                        className="max-h-[600px] w-full object-contain" 
                    />
                </div>
              </div>

              {/* Metrics Grid */}
              {result.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="PSNR" value={result.metrics.psnr} unit="dB" desc="Signal/Noise" color="text-blue-600" />
                    <MetricCard label="SSIM" value={result.metrics.ssim} unit="" desc="Structural Match" color="text-purple-600" />
                    <MetricCard label="Bit Rate" value={result.metrics.bpp} unit="bpp" desc="Data Density" color="text-orange-600" />
                    <MetricCard label="Accuracy" value={result.metrics.accuracy} unit="%" desc="Recovery Rate" color="text-emerald-600" />
                </div>
              )}

              {/* Decoded Text Result */}
              {view === 'decode' && mode === 'text' && result.message && (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl shadow-sm">
                  <h4 className="text-emerald-800 font-bold flex items-center gap-2 mb-4 text-lg">
                    <FileText size={24}/> Decoded Secret Message
                  </h4>
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100/50 font-mono text-emerald-900 shadow-sm break-all text-sm leading-relaxed">
                    {result.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, unit, desc, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black ${color || 'text-slate-800'}`}>
        {value}<span className="text-sm font-bold text-slate-400 ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-slate-400 font-medium mt-1">{desc}</p>
    </div>
  );
}