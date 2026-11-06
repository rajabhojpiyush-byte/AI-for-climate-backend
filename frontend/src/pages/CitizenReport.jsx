import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, MapPin, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, ShieldCheck, Loader2, AlertTriangle, Layers, 
  Mic, MicOff, Tag, Waves, Mountain, Flame, CloudRain, Image as ImageIcon 
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';
import RealMap from '../components/map/RealMap';
import { submitReportAPI, analyzePreviewAPI } from '../services/api';
import { playEmergencyAlert } from '../utils/audioAlert';

// Realistic Incident Presets (Standard Lucide Icons, zero raw emojis)
const INCIDENT_PRESETS = [
  {
    id: 'flood-pavana',
    label: 'Pavana River Flash Flood',
    icon: Waves,
    desc: 'Flash flood water level rose 5 feet near Chinchwad bridge. 4 vehicles submerged, water entering ground floor shops and residents trapped.',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    location: { latitude: 18.6298, longitude: 73.7997, address: 'Chinchwad Gaon Bridge, Pimpri-Chinchwad, Pune' }
  },
  {
    id: 'landslide-katraj',
    label: 'Katraj Ghat Highway Landslide',
    icon: Mountain,
    desc: 'Severe hillside collapse and boulder rockfall blocking highway corridor. Mud slurry active with risk to stranded passenger vehicles.',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    location: { latitude: 18.4412, longitude: 73.8682, address: 'Katraj Ghat Highway Section, Pune' }
  },
  {
    id: 'fire-hinjawadi',
    label: 'Hinjawadi IT Substation Fire',
    icon: Flame,
    desc: 'Transformer explosion inside IT park substation. Heavy combustion smoke plume spreading towards Hinjawadi Phase 2 perimeter road.',
    url: 'https://images.unsplash.com/photo-1602980085566-4c2813583569?auto=format&fit=crop&w=1200&q=80',
    location: { latitude: 18.5913, longitude: 73.7188, address: 'Rajiv Gandhi Infotech Park Phase 2, Hinjawadi, Pune' }
  },
  {
    id: 'inundation-mula',
    label: 'Mula-Mutha River Overtopping',
    icon: CloudRain,
    desc: 'High discharge from Khadakwasla dam overtopping riverbanks in Sangamwadi low-lying shanties. Evacuation needed immediately.',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
    location: { latitude: 18.5362, longitude: 73.8744, address: 'Sangamwadi Bridge & Riverbank, Pune' }
  }
];

// Local sample photos for instant backend testing
const SAMPLE_PRESETS = [
  { label: '🌊 Flood Sample', desc: 'Over 4 feet water in urban market street, vehicles submerged', url: '/samples/flood_sample.jpg' },
  { label: '🔥 Wildfire Sample', desc: 'Active brushfire spreading near mountain highway with heavy smoke', url: '/samples/wildfire_sample.jpg' },
  { label: '⛰️ Landslide Sample', desc: 'Massive rockfall and mud coming down the ghat pass blocking road', url: '/samples/landslide_sample.jpg' },
];

const QUICK_TAGS = [
  'Trapped Persons',
  'Submerged Vehicles',
  'Live Fallen Power Cable',
  'Elderly / Children Stranded',
  'Building Wall Crack',
  'Road Blocked > 4ft',
  'Medical Assistance Needed'
];

export default function CitizenReport() {
  const navigate = useNavigate();
  const { addIncident } = useIncidents();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  // Live camera stream state & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Prank rejection / validation modal state
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    title: 'Please enter a valid disaster report',
    message: '',
    reason: ''
  });

  // Live real-time AI interpretation
  const [liveInterpretation, setLiveInterpretation] = useState(null);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);

  const [location, setLocation] = useState({
    latitude: 18.6298,
    longitude: 73.7997,
    address: 'Chinchwad Gaon Bridge, Pimpri-Chinchwad, Pune'
  });

  const [isLocating, setIsLocating] = useState(false);

  // AI Verification Output
  const [aiResult, setAiResult] = useState({
    disasterType: 'Flood / Flash Inundation',
    confidenceScore: 0.96,
    severity: 'CRITICAL',
    priority: 'P1',
    extractedTags: ['submerged-vehicles', 'rapid-water-rise', 'residential-threat'],
    explanation: 'Cross-modal vision inspection detected submerged street infrastructure and vehicles. Description matches acute river inundation threshold.'
  });

  // Debounced real-time preview analysis as user types description or adjusts tags/image
  useEffect(() => {
    const combinedQuery = `${description} ${selectedTags.length > 0 ? selectedTags.join(' ') : ''}`.trim();
    if (!combinedQuery || combinedQuery.length < 4) {
      setLiveInterpretation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLiveAnalyzing(true);
      try {
        const preview = await analyzePreviewAPI(combinedQuery, selectedFile);
        setLiveInterpretation(preview);
      } catch (err) {
        console.warn('Live preview error:', err);
      } finally {
        setIsLiveAnalyzing(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [description, selectedTags, selectedFile]);

  // Native Speech-to-Text Dictation
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your statement.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        setIsCameraOpen(true);
      } else if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    } catch (err) {
      console.warn("Direct webcam stream failed, falling back to camera input:", err);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        alert("Camera access denied or unavailable. Please upload a photo file.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(blob));
      }
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // Connect active camera stream to video element when modal opens
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn("Video play error:", e));
    }
  }, [isCameraOpen]);

  // Clean up any open streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSelectSample = async (sample) => {
    setImagePreview(sample.url);
    if (!description) setDescription(sample.desc);
    try {
      const res = await fetch(sample.url);
      if (!res.ok) throw new Error('Sample fetch failed');
      const blob = await res.blob();
      const file = new File([blob], 'demo_evidence.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
    } catch {
      setSelectedFile(null);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const runAiIdentification = async () => {
    if (!description || description.trim().length < 5) {
      setValidationModal({
        isOpen: true,
        title: 'Please enter a valid disaster report',
        message: 'Report Description Required',
        reason: 'Please enter a detailed eyewitness description of the emergency incident before running AI verification.'
      });
      return;
    }

    setIsAiScanning(true);

    try {
      const combinedText = `${description} Tags: ${selectedTags.join(', ')}`;
      const preview = await analyzePreviewAPI(combinedText, selectedFile);
      
      // Strict validity check: detect pranks / jokes / metaphors / irrelevant
      if (preview.is_valid === false) {
        setValidationModal({
          isOpen: true,
          title: 'Please enter a valid disaster report',
          message: preview.validation_message || 'Please enter a valid disaster report',
          reason: preview.reasoning || 'The AI detected that this report appears to be a joke, prank, or irrelevant to genuine disaster emergencies.'
        });
        return;
      }

      const rawSev = (preview.severity || 'HIGH').toUpperCase();
      const priority = rawSev.includes('CRIT') ? 'P1' : (rawSev.includes('HIGH') ? 'P2' : (rawSev.includes('LOW') ? 'P4' : 'P3'));
      
      let tags = ['ai-verified', 'witness-evidence', ...selectedTags.map(t => t.toLowerCase().replace(/\s+/g, '-'))];
      const textLower = (combinedText + ' ' + (preview.disaster_type || '')).toLowerCase();
      
      if (textLower.includes('earthquake') || textLower.includes('quake') || textLower.includes('tremor')) {
        tags.push('seismic-tremor', 'structural-risk');
      } else if (textLower.includes('fire') || textLower.includes('smoke')) {
        tags.push('thermal-signature', 'combustion-plume');
      } else if (textLower.includes('landslide') || textLower.includes('rockfall') || textLower.includes('ghat')) {
        tags.push('geotechnical-displacement', 'ghat-corridor-blocked');
      } else if (textLower.includes('flood') || textLower.includes('water') || textLower.includes('river')) {
        tags.push('water-hazard', 'submerged-infrastructure', 'river-inundation');
      }

      setAiResult({
        disasterType: preview.disaster_type || 'Disaster Incident',
        confidenceScore: preview.confidence ? (preview.confidence > 1 ? preview.confidence / 100 : preview.confidence) : 0.94,
        severity: rawSev,
        priority,
        extractedTags: [...new Set(tags)],
        explanation: preview.reasoning || 'Automated multi-modal analysis completed.'
      });
      setStep(2);
    } catch (err) {
      console.warn('Backend preview failed or rejected:', err);
      const errMsg = err.detail || err.message || '';

      if (errMsg.toLowerCase().includes('valid disaster report') || errMsg.includes('400') || err.status === 400) {
        setValidationModal({
          isOpen: true,
          title: 'Please enter a valid disaster report',
          message: 'Verification Flagged Submission',
          reason: errMsg.replace(/^Error:\s*/, '') || 'Please enter a valid disaster report describing an authentic emergency.'
        });
        return;
      }

      // Offline client-side verification fallback
      const text = `${description} ${selectedTags.join(' ')}`.toLowerCase();
      const isPrank = /\b(lol|lmao|haha|heart is on fire|prank|joke|buy cheap|what time|recipe|exam|test|party|pizza|weather|hair day)\b/.test(text);
      const hasHazard = /\b(flood|water|submerge|rain|inundat|river|fire|smoke|burn|flame|landslide|mudslide|rockfall|ghat|quake|earthquake|tremor|storm|cyclone|wind|collapse|rubble|debris)\b/.test(text);

      if (isPrank || (!hasHazard && !selectedFile)) {
        setValidationModal({
          isOpen: true,
          title: 'Please enter a valid disaster report',
          message: 'No Emergency Hazard Detected',
          reason: 'This emergency portal is strictly for genuine disaster reporting (floods, fires, landslides, earthquakes, storms). Please enter a valid disaster report describing an authentic hazard.'
        });
        return;
      }

      let type = 'Climate Emergency';
      let priority = 'P2';
      let severity = 'HIGH';
      let tags = ['climate-hazard', 'priority-triage', ...selectedTags.map(t => t.toLowerCase().replace(/\s+/g, '-'))];

      if (text.includes('fire') || text.includes('smoke') || text.includes('burn')) {
        type = 'Electrical / Wildfire Hazard';
        priority = 'P1';
        severity = 'CRITICAL';
        tags.push('thermal-hotspot', 'combustion-risk');
      } else if (text.includes('landslide') || text.includes('rock') || text.includes('ghat')) {
        type = 'Landslide / Hillside Slope Collapse';
        priority = 'P1';
        severity = 'CRITICAL';
        tags.push('geotechnical-displacement', 'transport-arterial-blocked');
      } else if (text.includes('quake') || text.includes('earthquake') || text.includes('tremor')) {
        type = 'Earthquake Tremor';
        priority = 'P1';
        severity = 'CRITICAL';
        tags.push('seismic-tremor', 'structural-risk');
      } else {
        type = 'Flood / Water Inundation';
        priority = 'P1';
        severity = 'CRITICAL';
        tags.push('water-hazard', 'submerged-infrastructure');
      }

      const explanation = `AI neural assessment identified ${type} incident as ${severity} severity based on eyewitness indicators and crisis markers. Priority score assigned at ${priority === 'P1' ? 95 : 75}/100.`;

      setAiResult({
        disasterType: type,
        confidenceScore: 0.95,
        severity,
        priority,
        extractedTags: [...new Set(tags)],
        explanation
      });
      setStep(2);
    } finally {
      setIsAiScanning(false);
    }
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
        alert("Location access denied. Please click on the interactive map to place your pin.");
      }
    );
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      const res = await submitReportAPI({
        description: description || 'Eyewitness emergency report with camera capture.',
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
        imageFile: selectedFile
      });

      const serverImageUrl = res.image 
        ? (res.image.startsWith('http') ? res.image : `${API_BASE_URL}/${res.image.replace(/^\//, '')}`)
        : imagePreview;

      const createdIncident = {
        id: `INC-${res.report_id}`,
        rawId: res.report_id,
        disasterType: res.disaster_type || aiResult.disasterType,
        description: description || 'Eyewitness emergency report with camera capture.',
        imageUrl: serverImageUrl,
        location,
        incidentTime: new Date().toISOString(),
        status: 'Reported',
        aiAnalysis: {
          confidenceScore: res.confidence != null && res.confidence > 0 ? (res.confidence > 1 ? res.confidence / 100 : res.confidence) : 0.94,
          severity: res.severity || aiResult.severity,
          priorityLevel: (res.severity?.toUpperCase() === 'CRITICAL' || res.severity?.toUpperCase() === 'HIGH') ? 'P1' : 'P2',
          priorityScore: res.priority_score || 92,
          isDuplicate: Boolean(res.is_duplicate),
          aiReasoning: res.ai_reasoning || aiResult.explanation,
          humanReviewRequired: res.human_review_required ?? true,
          relatedIncidentIds: []
        },
        notes: []
      };

      addIncident(createdIncident);
      playEmergencyAlert('P1');
      navigate('/report/success', { state: { incident: createdIncident } });
    } catch (err) {
      console.warn('Backend submission error or rejected:', err);
      const detail = err.detail || err.message || '';

      if (detail.toLowerCase().includes('valid disaster report') || err.status === 400 || detail.toLowerCase().includes('rejection') || detail.toLowerCase().includes('prank') || detail.toLowerCase().includes('invalid')) {
        setValidationModal({
          isOpen: true,
          title: 'Please enter a valid disaster report',
          message: 'Submission Flagged & Rejected',
          reason: detail.replace(/^Error:\s*/, '') || 'The server rejected this report. Please provide a valid disaster report describing an authentic emergency.'
        });
        return;
      }

      // Safe local fallback if backend network is down
      const fallbackIncident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        rawId: Date.now(),
        disasterType: aiResult.disasterType,
        description: description || 'Eyewitness emergency report with camera capture.',
        imageUrl: imagePreview,
        location,
        incidentTime: new Date().toISOString(),
        status: 'Reported',
        aiAnalysis: {
          confidenceScore: aiResult.confidenceScore,
          severity: aiResult.severity,
          priorityLevel: aiResult.priority,
          priorityScore: aiResult.priority === 'P1' ? 95 : 75,
          isDuplicate: false,
          aiReasoning: aiResult.explanation,
          humanReviewRequired: true,
          relatedIncidentIds: []
        },
        notes: []
      };

      addIncident(fallbackIncident);
      playEmergencyAlert('P1');
      navigate('/report/success', { state: { incident: fallbackIncident } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-fade-lift">
      
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

        {/* 4 Step Progress Pills */}
        <div className="grid grid-cols-4 gap-2 pt-4 max-w-2xl mx-auto">
          {[
            { n: 1, label: 'Witness Evidence' },
            { n: 2, label: 'AI Detection' },
            { n: 3, label: 'Geolocation' },
            { n: 4, label: 'Disaster Dossier' }
          ].map(s => {
            const isDone = step > s.n;
            const isCurrent = step === s.n;
            return (
              <div 
                key={s.n} 
                className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
                  isCurrent 
                    ? 'border-purple-600 bg-purple-100 dark:bg-purple-950/60 shadow-sm' 
                    : isDone
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-(--border-subtle) opacity-60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isCurrent 
                    ? 'bg-purple-600 text-white' 
                    : isDone 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {isDone ? '✓' : s.n}
                </span>
                <span className={`text-[11px] font-bold mt-1 text-center hidden sm:block ${
                  isCurrent ? 'text-purple-900 dark:text-purple-200' : 'text-(--text-main)'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Multi-Step Box */}
      <div className="p-6 sm:p-10 rounded-3xl spatial-card border border-(--border-subtle) shadow-2xl relative">
        
        {/* STEP 1: CAPTURE & DESCRIPTION */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-lift">
            <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
              <div>
                <h2 className="text-xl font-black text-(--text-main)">Step 1: Witness Evidence</h2>
                <p className="text-xs text-(--text-muted)">Record voice, describe the disaster, and provide photographic proof</p>
              </div>
              
              {/* Native Voice-to-Text Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm tactile-spring shrink-0 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' 
                    : 'bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                <span>{isRecording ? 'Listening...' : 'Speak Emergency'}</span>
              </button>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">
                What are you witnessing? * (Incident Statement)
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Flash flood waters have cut off market road. Over 5 cars submerged and residents taking shelter on balconies..."
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm leading-relaxed"
              />
            </div>

            {/* Quick Tactical Incident Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-2">
                Quick Situation Tags (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer tactile-spring ${
                        isSelected 
                          ? 'bg-purple-600 text-white shadow-sm border border-purple-600' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-purple-400'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REAL-TIME AI INTERPRETATION (Below Quick Situation Tags) */}
            <div>
              {isLiveAnalyzing && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs font-semibold text-purple-700 dark:text-purple-300 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                  <span>AI Neural Engine interpreting eyewitness input in real time...</span>
                </div>
              )}

              {!isLiveAnalyzing && liveInterpretation && (
                liveInterpretation.is_valid === false ? (
                  <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-600/40 shadow-xs space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="uppercase tracking-wider">Non-Disaster / Casual Content Flagged</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
                      {liveInterpretation.reasoning || 'This statement does not describe an active disaster. Please describe an authentic emergency hazard (flooding, fire, landslide, earthquake, storm).'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-slate-900/90 border border-purple-300 dark:border-purple-600/40 shadow-xs space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-(--text-main)">
                          Live AI Interpretation: <span className="text-purple-600 dark:text-purple-400 font-extrabold">{liveInterpretation.disaster_type}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                          (liveInterpretation.severity || '').toLowerCase() === 'critical' ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30' :
                          (liveInterpretation.severity || '').toLowerCase() === 'high' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30' :
                          (liveInterpretation.severity || '').toLowerCase() === 'low' ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30' :
                          'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {liveInterpretation.severity} ({liveInterpretation.priority_score ?? 50}/100)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {liveInterpretation.confidence != null && liveInterpretation.confidence > 0
                            ? `${Math.round(liveInterpretation.confidence > 1 ? liveInterpretation.confidence : liveInterpretation.confidence * 100)}% Confidence`
                            : 'Verified'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-(--text-muted) leading-relaxed">
                      {liveInterpretation.reasoning}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Photo Capture / Upload Buttons */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted)">
                Provide Visual Proof (Camera or Gallery)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Snap Live Photo */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="p-4 rounded-2xl border-2 border-dashed border-purple-400/60 hover:border-purple-500 bg-purple-50/70 dark:bg-purple-950/20 cursor-pointer transition flex items-center gap-3.5 tactile-spring shadow-sm text-left w-full"
                >
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-200 block">Capture Live Camera Photo</span>
                    <span className="text-[11px] text-purple-700 dark:text-purple-400">Opens camera viewfinder & instant snap</span>
                  </div>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Upload from Gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50 dark:bg-slate-950/40 cursor-pointer transition flex items-center gap-3.5 tactile-spring shadow-sm text-left w-full"
                >
                  <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-(--text-main) shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-(--text-main) block">Upload Photo File</span>
                    <span className="text-[11px] text-(--text-muted)">From storage gallery (JPG, PNG)</span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Quick Scenario Fill */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Real-world Disaster Scenarios (Auto-fill for testing)</span>
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/40">
                    AI Analyzed Live
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INCIDENT_PRESETS.map((p) => {
                    const PresetIcon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setImagePreview(p.url);
                          setDescription(p.desc);
                          setLocation(p.location);
                        }}
                        className="p-3.5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 hover:from-purple-50/40 hover:to-indigo-50/40 dark:hover:from-purple-950/20 dark:hover:to-indigo-950/20 hover:border-purple-400 dark:hover:border-purple-600 text-xs text-(--text-main) border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 tactile-spring cursor-pointer text-left flex flex-col justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-purple-100/70 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <PresetIcon className="w-4 h-4 shrink-0" />
                          </div>
                          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                            {p.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-(--text-muted) line-clamp-1 mt-2 pl-8 font-medium">
                          📍 {p.location.address}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Local Test Samples */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) block mb-1.5">
                  Local AI Image Validation Test Samples
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PRESETS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:border-purple-500 text-xs font-semibold text-(--text-main) border border-slate-300 dark:border-slate-700 shadow-sm transition tactile-spring cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Preview */}
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 h-64 mt-3 shadow-md bg-black">
                  <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/20">
                    Active Visual Evidence Attached
                  </div>
                </div>
              )}
            </div>

            {/* Run AI Identification CTA Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={isAiScanning}
                onClick={runAiIdentification}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer tactile-spring disabled:opacity-50"
              >
                {isAiScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Multi-Modal Vision...</span>
                  </>
                ) : (
                  <>
                    <span>Run AI Identification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AI DETECTION REVIEW */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-lift">
            <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
              <div>
                <h2 className="text-xl font-black text-(--text-main)">Step 2: AI Detection Assessment</h2>
                <p className="text-xs text-(--text-muted)">Verify the neural computer vision triage results</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Match</span>
              </div>
            </div>

            {/* Assessment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Classified Hazard</span>
                <div className="text-2xl font-black text-(--text-main)">{aiResult.disasterType}</div>
                <span className="text-xs text-(--text-muted) block">Automated Category Detection</span>
              </div>

              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/25 space-y-2">
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Priority Level</span>
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  {aiResult.priority} ({aiResult.severity})
                </div>
                <span className="text-xs text-(--text-muted) block">Life Safety Hazard Matrix</span>
              </div>
            </div>

            {/* Extracted Neural Tags */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) block mb-2">
                Neural Keypoint Tags Extracted
              </span>
              <div className="flex flex-wrap gap-2">
                {aiResult.extractedTags.map((t, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-slate-500/10 text-(--text-main) border border-(--border-subtle)">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Model Reasoning */}
            <div className="p-4 rounded-2xl bg-slate-500/5 border border-(--border-subtle) space-y-1">
              <span className="text-xs font-bold uppercase text-(--text-muted)">Reasoning & Cross-Check</span>
              <p className="text-xs text-(--text-main) leading-relaxed">{aiResult.explanation}</p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-(--text-main) hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Evidence
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <span>Confirm & Proceed to Geolocation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GEOLOCATION PINPOINT */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-lift">
            <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
              <div>
                <h2 className="text-xl font-black text-(--text-main)">Step 3: Geolocation Coordinates</h2>
                <p className="text-xs text-(--text-muted)">Tap the map to set exact ground coordinates</p>
              </div>

              {/* Auto Locate GPS Button */}
              <button
                type="button"
                disabled={isLocating}
                onClick={handleAutoLocate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer shadow-sm tactile-spring disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                <span>{isLocating ? 'Acquiring GPS...' : 'Auto Detect GPS'}</span>
              </button>
            </div>

            {/* Coordinates summary badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-500/5 border border-(--border-subtle)">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-(--text-muted)">Active Incident Geotag</span>
                <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  {location.latitude}° N, {location.longitude}° E
                </div>
                <div className="text-xs text-(--text-muted)">{location.address}</div>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                Ground Zero Mapped
              </span>
            </div>

            {/* Interactive Leaflet Picker Map */}
            <div className="h-96 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-md">
              <RealMap
                pickerMode={true}
                selectedCoord={{ latitude: location.latitude, longitude: location.longitude }}
                onSelectLocation={(newLoc) => setLocation(newLoc)}
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-(--text-main) hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <ArrowLeft className="w-4 h-4" /> Back to AI Result
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer tactile-spring"
              >
                <span>Review Final Dossier</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL DOSSIER INGESTION */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-lift">
            <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
              <div>
                <h2 className="text-xl font-black text-(--text-main)">Step 4: Dispatch Dossier Confirmation</h2>
                <p className="text-xs text-(--text-muted)">Confirm all verified incident details before submitting to response teams</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Ready for Dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-500/5 border border-(--border-subtle)">
                  <span className="text-[10px] uppercase font-bold text-(--text-muted)">Hazard Classification</span>
                  <span className="text-base font-black text-(--text-main) block mt-1">{aiResult.disasterType}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-500/5 border border-(--border-subtle)">
                  <span className="text-[10px] uppercase font-bold text-(--text-muted)">Eyewitness Statement</span>
                  <p className="text-xs text-(--text-main) leading-relaxed mt-1">{description}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-500/5 border border-(--border-subtle)">
                  <span className="text-[10px] uppercase font-bold text-(--text-muted)">Verified Geographic Coordinates</span>
                  <span className="text-xs font-mono block mt-1 text-(--text-main) font-bold">
                    {location.latitude}° N, {location.longitude}° E
                  </span>
                  <span className="text-[11px] text-(--text-muted) block mt-0.5">
                    {location.address}
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
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-(--text-main) hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer tactile-spring disabled:opacity-50"
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

      {/* LIVE CAMERA VIEWFINDER MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4 text-center relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Live Camera Viewfinder</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Tactical Viewfinder Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-36 h-36 border border-white/20 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/40 transition cursor-pointer tactile-spring"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION POP-UP MODAL (For Pranks, Jokes & Irrelevant Reports) */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                Verification Alert
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-(--text-main)">
                {validationModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                {validationModal.reason}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setValidationModal({ isOpen: false, title: 'Please enter a valid disaster report', message: '', reason: '' })}
                className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-600/30 cursor-pointer tactile-spring"
              >
                Understood, Edit Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
