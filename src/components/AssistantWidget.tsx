import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic } from 'lucide-react';
import { processUserMessage } from '../services/assistant';
import type { ChatMessage } from '../services/assistant';
import { RiskBadge } from '../design/RiskBadge';

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'assistant', text: "Hello! I'm your Pashu Rakshak assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

const handleMicClick = () => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
    return;
  }
  if (isRecording) return;

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  setIsRecording(true);
  setInput('');

  recognition.onresult = (event: any) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    setInput(transcript);
  };

  recognition.onerror = () => setIsRecording(false);
  recognition.onend = () => setIsRecording(false);

  recognition.start();
};

  const SUGGESTIONS = [
    "What are the symptoms of LSD?",
    "Where is the nearest lab?",
    "Are there any weather alerts?",
    "I need to book a vet appointment."
  ];

  const handleSend = async (overrideText?: string) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (typeof overrideText !== 'string') setInput('');
    setIsTyping(true);

    const reply = await processUserMessage(userMsg.text);
    setIsTyping(false);
    setMessages(prev => [...prev, reply]);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-terracotta text-cream rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-cream rounded-2xl shadow-2xl flex flex-col z-50 border border-espresso/10 overflow-hidden">
          <div className="bg-espresso text-cream p-4 flex justify-between items-center">
            <h3 className="font-bold tracking-wide">Pashu Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-cream/70 hover:text-cream">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-terracotta text-cream rounded-br-sm' : 'bg-white border border-espresso/10 text-espresso rounded-bl-sm'}`}>
                  {m.text}
                </div>
                {m.ui?.type === 'disease_card' && (
                  <div className="mt-2 bg-white border border-espresso/10 p-3 rounded-lg shadow-sm w-[85%]">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-sm">{m.ui.disease.abbreviation}</strong>
                      <RiskBadge tier={m.ui.disease.severity.toUpperCase() as any} label={m.ui.disease.severity} />
                    </div>
                    <div className="text-xs text-espresso-70 mt-1">
                      <strong>Early:</strong> {m.ui.disease.symptoms?.early?.join(', ') || 'N/A'}<br/>
                      <strong>Late:</strong> {m.ui.disease.symptoms?.late?.join(', ') || 'N/A'}
                    </div>
                  </div>
                )}
                {m.ui?.type === 'facility_card' && (
                  <div className="mt-2 bg-white border border-espresso/10 p-3 rounded-lg shadow-sm w-[85%]">
                    <strong className="text-sm">{m.ui.facility.name}</strong>
                    <div className="text-xs text-espresso-70 mt-1">
                      Distance: 4.2 km<br/>
                      Status: {m.ui.facility.availability}
                    </div>
                    <div className="mt-2 text-xs font-bold text-espresso">Why recommended:</div>
                    <ul className="text-xs text-espresso-70 list-disc pl-4 mt-1">
                      {m.ui.whyRecommended.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {m.ui?.type === 'draft_report' && (
                  <div className="mt-2 bg-risk-watch/10 border border-risk-watch/30 p-3 rounded-lg shadow-sm w-[85%]">
                    <strong className="text-sm text-risk-watch">Draft Report</strong>
                    <div className="text-xs mt-1">
                      Species: {m.ui.species}<br/>
                      Symptom: {m.ui.symptom}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-white border border-espresso/10 p-3 rounded-2xl rounded-bl-sm flex gap-1">
                  <div className="w-2 h-2 bg-espresso-40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-espresso-40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-espresso-40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(s)}
                className="text-[10px] bg-white border border-espresso/20 text-espresso px-2 py-1 rounded-full hover:bg-espresso/5 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-espresso/10 flex items-center gap-2">
            <button 
              onClick={handleMicClick}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isRecording ? 'bg-risk-deep-rust text-white animate-pulse' : 'bg-espresso/10 text-espresso hover:bg-espresso/20'}`}
            >
              <Mic size={18} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Listening..." : "Type your message..."}
              disabled={isRecording}
              className="flex-1 min-w-0 bg-transparent outline-none border border-espresso/20 rounded-full px-4 py-2 text-sm focus:border-terracotta disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend()}
              className="w-10 h-10 bg-terracotta text-cream rounded-full flex items-center justify-center hover:bg-clay transition-colors disabled:opacity-50 flex-shrink-0"
              disabled={!input.trim() || isTyping || isRecording}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
