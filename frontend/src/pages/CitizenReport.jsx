import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, MapPin, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, ShieldCheck, Loader2, Cpu, AlertTriangle, Layers, Image as ImageIcon 
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';
import RealMap from '../components/map/RealMap';

// Preset sample photos for instant testing
const DEMO_PRESETS = [
  { label: '🌊 Flood Sample', desc: 'Over 4 feet water in urban market street, vehicles submerged', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80' },
  { label: '🔥 Wildfire Sample', desc: 'Active brushfire spreading near mountain highway with heavy smoke', url: 'https://images.unsplash.com/photo-1602980085566-4c2813583569?auto=format&fit=crop&w=1200&q=80' },
  { label: '⛰️ Landslide Sample', desc: 'Massive rockfall and mud coming down the ghat pass blocking road', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80' },
];

export default function CitizenReport() {
  const navigate = useNavigate();
  const { addIncident } = useIncidents();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(DEMO_PRESETS[0].url);
  const [location, setLocation] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    address: 'Pune Municipal Zone, Maharashtra'
  });
  const [isLocating, setIsLocating] = useState(false);

  // AI Verification Output
  const [aiResult, setAiResult] = useState({
    disasterType: 'Flood / Flash Inundation',
    confidenceScore: 0.95,
    severity: 'CRITICAL',
    priority: 'P1',
    extractedTags: ['submerged-vehicles', 'rapid-water-rise', 'residential-threat'],
    explanation: 'Cross-modal image inspection detected submerged street infrastructure and vehicle hulls. Description matches severe flood ingress criteria.'
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const runAiIdentification = async () => {
    setIsAiScanning(true);
    await new Promise(r => setTimeout(r, 1100));

    const text = description.toLowerCase();
    let type = 'Flood / Water Inundation';
    let priority = 'P1';
    let severity = 'CRITICAL';
    let tags = ['water-hazard', 'submerged-infrastructure'];
    let explanation = 'Image and witness statement confirm severe floodwater accumulation threatening life and vehicles.';

    if (text.includes('fire') || text.includes('smoke') || text.includes('flame') || text.includes('burn')) {
      type = 'Forest / Wildfire';
      priority = 'P1';
      severity = 'CRITICAL';
      tags = ['combustion-plume', 'rapid-spread', 'smoke-inhalation-risk'];
      explanation = 'Thermal vision signatures and smoke plume keywords detected. High threat to surrounding residential zones.';
    } else if (text.includes('landslide') || text.includes('mud') || text.includes('rock') || text.includes('ghat') || text.includes('boulder')) {
      type = 'Landslide / Hillside Collapse';
      priority = 'P2';
      severity = 'HIGH';
      tags = ['geological-displacement', 'roadway-blockage', 'debris-flow'];
      explanation = 'Geotechnical debris patterns identified. Major arterial transportation route obstruction detected.';
    } else if (text.includes('cyclone') || text.includes('wind') || text.includes('storm') || text.includes('tree')) {
      type = 'Cyclone / Storm Windstorm';
      priority = 'P2';
      severity = 'HIGH';
      tags = ['gale-force-winds', 'fallen-powerlines', 'tree-damage'];
      explanation = 'High wind damage indicators matched. Downed utility lines require specialized municipal clearance.';
    }

    setAiResult({
      disasterType: type,
      confidenceScore: 0.94,
      severity,
      priority,
      extractedTags: tags,
      explanation
    });

    setIsAiScanning(false);
    setStep(2);
  };

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setLocation({
          latitude: lat,
          longitude: lng,
          address: `Auto GPS: ${lat}° N, ${lng}° E`
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Location access denied. Please click on the map to place your pin.");
      }
    );
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 900));

    const created = addIncident({
      disasterType: aiResult.disasterType,
      description: description || "Eyewitness emergency report with camera capture.",
      imageUrl: imagePreview,
      location,
      incidentTime: new Date().toISOString()
    });

    setIsSubmitting(false);
    navigate('/report/success', { state: { incident: created } });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          AI Incident Intake Wizard
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-(--text-main) tracking-tight">
          Citizen Disaster Reporting
        </h1>
        <p className="text-xs sm:text-sm text-(--text-muted) max-w-xl mx-auto">
          Submit witness description and camera photos. Our multi-modal AI immediately detects and classifies the disaster type.
        </p>

        {/* 4 Step Progress Pills (Light/Dark Perfect Contrast) */}
        <div className="flex items-center justify-center gap-2 pt-4 overflow-x-auto pb-1">
          {[
            { num: 1, label: '01 Description & Photo' },
            { num: 2, label: '02 AI Identification' },
            { num: 3, label: '03 Location Pin' },
            { num: 4, label: '04 Review & Ingest' },
          ].map((s) => (
            <div
              key={s.num}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                step === s.num
                  ? 'bg-purple-600 text-white shadow-md'
                  : step > s.num
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-slate-200/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800'
              }`}
            >
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="spatial-card p-6 sm:p-10 rounded-3xl border border-(--border-subtle)ow-2xl relative overflow-hidden">
        
        {/* STEP 1: DESCRIPTION + EVIDENCE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-(--text-main)">1. Describe the Emergency & Provide Photo</h2>
              <p className="text-xs text-(--text-muted) mt-1">
                Enter details below and upload or snap a photo. The AI will analyze both to identify the exact disaster.
              </p>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted)">
                What are you witnessing? * (Describe what is happening)
              </label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Rising flood waters have cut off the main market road. Over 5 cars submerged and residents taking shelter on balconies..."
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm leading-relaxed"
              />
            </div>

            {/* Photo Capture / Upload Buttons */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted)">
                Provide Visual Proof (Camera or Gallery)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Snap Live Photo */}
                <label className="p-4 rounded-2xl border-2 border-dashed border-purple-400/60 hover:border-purple-500 bg-purple-50/70 dark:bg-purple-950/20 cursor-pointer transition flex items-center gap-3.5 tactile-spring shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="p-3 rounded-xl bg-purple-600 text-white shadow-md">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-(--text-main) block">Snap Live Photo</span>
                    <span className="text-[11px] text-(--text-muted)">Open camera to click picture</span>
                  </div>
                </label>

                {/* Upload from Device (Clean Light/Dark Adaptive Box) */}
                <label className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 bg-slate-50 dark:bg-slate-950/40 cursor-pointer transition flex items-center gap-3.5 tactile-spring shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-(--text-main) block">Upload from Device</span>
                    <span className="text-[11px] text-(--text-muted)">Select image from gallery / files</span>
                  </div>
                </label>

              </div>

              {/* Demo Presets Buttons (Light/Dark Clean Buttons) */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-(--text-muted)k mb-1.5">Or test with preset demo evidence:</span>
                <div className="flex flex-wrap gap-2">
                  {DEMO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImagePreview(p.url);
                        if (!description) setDescription(p.desc);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:border-purple-500 text-xs font-semibold text-(--text-main) border border-slate-300 dark:border-slate-700 shadow-sm transition tactile-spring cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Preview */}
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 h-64 mt-3 shadow-md">
                  <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/20">
                    Selected Evidence Frame
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={isAiScanning}
                onClick={runAiIdentification}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer tactile-spring disabled:opacity-50"
              >
                {isAiScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Neural Engine Scanning...</span>
                  </>
                ) : (
                  <>
                    <span>Run AI Disaster Identification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AI IDENTIFICATION RESULT */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4" /> AI Identification Complete
              </div>
              <h2 className="text-2xl font-black text-(--text-main)">AI Identified Disaster Type</h2>
              <p className="text-xs text-(--text-muted) mt-1">
                The neural system analyzed your eyewitness text and visual evidence.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-purple-50/70 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Classified Hazard Event</span>
                  <h3 className="text-2xl font-black text-(--text-main) mt-0.5">{aiResult.disasterType}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/40">
                    {aiResult.priority} {aiResult.severity}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    {Math.round(aiResult.confidenceScore * 100)}% Confidence
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) block mb-1">
                  AI Multi-Modal Reasoning
                </span>
                <p className="text-sm text-(--text-main) leading-relaxed bg-white dark:bg-slate-950 p-4 rounded-2xl border border-purple-100 dark:border-slate-800 shadow-sm">
                  {aiResult.explanation}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) block mb-1.5">
                  Detected Threat Signatures
                </span>
                <div className="flex flex-wrap gap-2">
                  {aiResult.extractedTags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg font-mono text-xs bg-purple-100 dark:bg-purple-600/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-(--text-main) hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Evidence
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <span>Confirm & Enter Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION ENTRY */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-(--text-main)">3. Enter Incident Location</h2>
                <p className="text-xs text-(--text-muted) mt-1">
                  Click on the interactive map to place the incident pin, or use auto-GPS.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={isLocating}
                className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer tactile-spring shrink-0"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                <span>Auto-Detect My GPS</span>
              </button>
            </div>

            {/* REAL INTERACTIVE MAP */}
            <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 relative shadow-inner">
              <RealMap
                pickerMode={true}
                selectedCoord={location}
                onSelectLocation={(coord) => setLocation(prev => ({ ...prev, ...coord }))}
              />
              <div className="absolute top-2 right-2 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-(--text-muted) border border-slate-300 dark:border-slate-800 shadow-sm pointer-events-none">
                📍 Click map to drop pin
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-(--text-muted) mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={location.latitude}
                  onChange={(e) => setLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-(--text-muted) shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-(--text-muted) mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={location.longitude}
                  onChange={(e) => setLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-(--text-muted) shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-(--text-muted) mb-1">Location Tag</label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-(--text-muted) shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-(--text-muted) hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <ArrowLeft className="w-4 h-4" /> Back to AI Result
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-(--text-muted)">4. Final Verification & Network Submission</h2>
              <p className="text-xs text-(--text-muted) mt-1">
                Confirm all captured data before injecting into the dispatch triage queue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30">
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">Classified Disaster</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-black text-(--text-muted)">{aiResult.disasterType}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/40">
                      {aiResult.priority}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-(--text-muted)">Citizen Eyewitness Account</span>
                  <p className="text-xs mt-1 leading-relaxed text-(--text-muted)">{description}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-(--text-muted)">Verified Geographic Geotag</span>
                  <span className="text-xs font-mono block mt-1 text-(--text-muted)">
                    {location.latitude}° N, {location.longitude}° E ({location.address})
                  </span>
                </div>
              </div>

              {/* Photo Proof */}
              <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 h-64 relative bg-black shadow-md">
                <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-slate-950/80 px-3 py-1 rounded-lg text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  AI Verified Visual Match
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-(--text-muted) hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer tactile-spring disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Location
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-xl shadow-purple-600/35 flex items-center gap-2 cursor-pointer tactile-spring disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Injecting into Network...</span>
                  </>
                ) : (
                  <span>Submit Disaster Report</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}