import diseasesData from '../mock/diseases.json';
import facilitiesData from '../mock/facilities.json';
import weatherData from '../mock/weather.json';
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  ui?: any; // For rendering custom UI components in chat
}

// Simple rule-based parser
export const processUserMessage = async (message: string): Promise<ChatMessage> => {
  const lowerMsg = message.toLowerCase();
  let responseText = "I'm sorry, I didn't understand that. You can ask about diseases, facility locations, or report symptoms.";
  let ui = null;

  // Flow 1: Disease lookup
  // "What are the symptoms of LSD?"
  if (lowerMsg.includes('symptom') || lowerMsg.includes('disease')) {
    const matchedDisease = diseasesData.find(d => 
      lowerMsg.includes(d.abbreviation.toLowerCase()) || 
      (d.disease_name.en && lowerMsg.includes(d.disease_name.en.toLowerCase()))
    );

    if (matchedDisease) {
      responseText = `Here is information on ${matchedDisease.disease_name.en} (${matchedDisease.abbreviation}):`;
      ui = {
        type: 'disease_card',
        disease: matchedDisease
      };
    } else {
      responseText = "Which disease are you asking about? For example, ask about LSD or FMD.";
    }
  }

  // Flow 2: Facility lookup
  // "Where is the nearest lab?"
  else if (lowerMsg.includes('lab') || lowerMsg.includes('facility') || lowerMsg.includes('hospital')) {
    // Just find a diagnostic lab in Rajpura (V01) as default for demo
    const lab = facilitiesData.find(f => f.type === 'diagnostic_laboratory');
    if (lab) {
      responseText = `The nearest lab is ${lab.name}.`;
      ui = {
        type: 'facility_card',
        facility: lab,
        whyRecommended: [
          'It is the closest facility with the required diagnostic capabilities.',
          'Currently marked as available with high capacity.',
          'Maintains cold chain for sample integrity.'
        ]
      };
    } else {
      responseText = "I couldn't find a nearby facility.";
    }
  }

  // Flow 3: Reporting flow
  // "My cow has a fever"
  else if (lowerMsg.includes('my') || lowerMsg.includes('has a') || lowerMsg.includes('fever')) {
    // Extract species
    let species = 'unknown';
    if (lowerMsg.includes('cow')) species = 'cattle';
    if (lowerMsg.includes('buffalo')) species = 'buffalo';
    if (lowerMsg.includes('pig')) species = 'pig';
    
    // Extract symptom
    let symptom = 'unknown';
    if (lowerMsg.includes('fever')) symptom = 'fever';

    responseText = `I've prepared a draft report for your ${species} with ${symptom}. Please provide your village ID to submit it.`;
    ui = {
      type: 'draft_report',
      species,
      symptom
    };
  }
  
  // Flow 4: Weather Alerts
  // "Are there any alerts?" or "weather"
  else if (lowerMsg.includes('alert') || lowerMsg.includes('weather') || lowerMsg.includes('rain')) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

    const hourlyPatiala = (weatherData as any).hourly?.Patiala || [];
    const todaysSlots = hourlyPatiala.filter((h: any) => h.date === todayStr);

    let closest = todaysSlots[0];
    for (const slot of todaysSlots) {
      if (slot.hour <= currentHour) closest = slot;
    }

    if (!closest) {
      // fallback to the old snapshot data if no hourly match for today
      const district = weatherData.districts['Patiala'];
      responseText = `Weather for Patiala — ${dateStr}, ${timeStr}\n${district.tempC}°C, ${district.humidityPct}% humidity, ${district.rainfallLast7dMm}mm rain (last 7 days).`;
    } else {
      const alertLine = closest.rainChancePct >= 30
        ? `⚠️ ${closest.rainChancePct}% chance of rain — keep animals sheltered.`
        : closest.feelsLikeC >= 40
        ? `⚠️ Feels like ${closest.feelsLikeC}°C — heat stress risk, ensure shade and water access.`
        'No active alerts.';

      responseText = `Weather for Patiala — ${dateStr}, ${timeStr}\n${closest.condition}, ${closest.tempC}°C (feels like ${closest.feelsLikeC}°C), ${closest.humidityPct}% humidity.\n${alertLine}`;
    }
  }
  // Flow 5: Vet / Appointment
  // "Speak to a vet" or "book appointment"
  else if (lowerMsg.includes('vet') || lowerMsg.includes('appointment') || lowerMsg.includes('doctor')) {
    responseText = "I can help you connect with a veterinary officer. The next available appointment in your district (Patiala) is tomorrow at 10:00 AM. Would you like me to book it?";
  }

  else if (lowerMsg.includes('v01') || lowerMsg.includes('village')) {
    responseText = "Thank you. Your report has been submitted successfully to the local authorities.";
  }
  
  else if (lowerMsg === 'yes' || lowerMsg === 'book it') {
    responseText = "Your appointment has been successfully booked for tomorrow at 10:00 AM. You will receive an SMS confirmation shortly.";
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: responseText,
        ui
      });
    }, 800); // Simulated 800ms delay
  });
};
