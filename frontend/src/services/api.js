import { API_BASE_URL } from '../config';

// Convert backend Report object to frontend incident shape
export function formatReportToIncident(report) {
  if (!report) return null;

  // Compute severity and priority mappings
  const rawSev = (report.severity || 'MODERATE').toUpperCase();
  let priorityLevel = 'P3';
  let priorityScore = Math.round(Number(report.priority_score || 50));

  if (rawSev.includes('CRIT') || rawSev.includes('HIGH')) {
    priorityLevel = rawSev.includes('CRIT') ? 'P1' : 'P2';
    priorityScore = priorityScore || (priorityLevel === 'P1' ? 92 : 78);
  } else if (rawSev.includes('LOW')) {
    priorityLevel = 'P4';
    priorityScore = priorityScore || 35;
  }

  // Handle image path (local uploads vs absolute URLs)
  let imageUrl = report.image;
  if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    imageUrl = `${API_BASE_URL}/${imageUrl.replace(/^\//, '')}`;
  }

  return {
    id: `INC-${report.id}`,
    rawId: report.id,
    disasterType: report.disaster_type || 'Unclassified Event',
    description: report.description || '',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: report.latitude || 18.5204,
      longitude: report.longitude || 73.8567,
      address: `Lat ${Number(report.latitude || 0).toFixed(4)}, Lon ${Number(report.longitude || 0).toFixed(4)}`
    },
    incidentTime: report.timestamp || new Date().toISOString(),
    status: report.status || 'Reported',
    aiAnalysis: {
      confidenceScore: (report.confidence ? (report.confidence > 1 ? report.confidence / 100 : report.confidence) : 0.90),
      severity: rawSev,
      priorityLevel,
      priorityScore,
      isDuplicate: Boolean(report.is_duplicate),
      aiReasoning: report.ai_reasoning || 'AI analysis completed.',
      humanReviewRequired: report.human_review_required ?? true,
      relatedIncidentIds: []
    },
    notes: []
  };
}

// Fetch all reports from FastAPI backend
export async function fetchReportsAPI() {
  const response = await fetch(`${API_BASE_URL}/reports`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.statusText}`);
  }
  const data = await response.json();
  return data.map(formatReportToIncident);
}

// Fetch a single report by ID
export async function fetchReportByIdAPI(id) {
  const numericId = String(id).replace(/^INC-/i, '');
  const response = await fetch(`${API_BASE_URL}/reports/${numericId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Error fetching report #${id}: ${response.statusText}`);
  }
  const data = await response.json();
  return formatReportToIncident(data);
}

// Step 2 Preview: Analyze disaster description using Nugen / Backend
export async function analyzePreviewAPI(description) {
  const formData = new FormData();
  formData.append('description', description);

  const response = await fetch(`${API_BASE_URL}/analyze-preview`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Preview analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

// Submit a new citizen report with image file to FastAPI (which calls Nugen AI)
export async function submitReportAPI({ description, latitude, longitude, timestamp, imageFile }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('latitude', latitude.toString());
  formData.append('longitude', longitude.toString());
  formData.append('timestamp', timestamp || new Date().toISOString());
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Submission failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result;
}

// Update report status (Authority Dashboard)
export async function updateReportStatusAPI(id, newStatus) {
  const numericId = String(id).replace(/^INC-/i, '');
  const response = await fetch(`${API_BASE_URL}/reports/${numericId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update status for report #${id}`);
  }

  return await response.json();
}
