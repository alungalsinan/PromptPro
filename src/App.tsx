import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Bot, 
  AlertCircle, 
  Info,
  Copy,
  Check,
  Zap,
  Hash,
  RefreshCw,
  Save,
  History,
  Download,
  Upload,
  Trash2,
  Star,
  StarOff,
  Clock,
  BarChart3,
  Settings,
  FileText,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  category: string;
  isFavorite: boolean;
  createdAt: Date;
}

interface PromptHistory {
  id: string;
  prompt: string;
  response: string;
  timestamp: Date;
  temperature: number;
  maxTokens: number;
  responseTime: number;
  tokenCount: number;
}

interface PromptAnalysis {
  clarity: number;
  specificity: number;
  structure: number;
  suggestions: string[];
}

function App() {
  // Core state
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Advanced features state
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates' | 'analysis'>('compose');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysis | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [tokenCount, setTokenCount] = useState<number>(0);

  // Advanced parameters
  const [topP, setTopP] = useState(1.0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.0);
  const [presencePenalty, setPresencePenalty] = useState(0.0);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('promptHistory');
    const savedTemplates = localStorage.getItem('promptTemplates');
    const savedFavorites = localStorage.getItem('favorites');
    
    if (savedHistory) setPromptHistory(JSON.parse(savedHistory));
    if (savedTemplates) setPromptTemplates(JSON.parse(savedTemplates));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && prompt.trim()) {
      const timer = setTimeout(() => {
        localStorage.setItem('currentPrompt', prompt);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [prompt, autoSave]);

  // Analyze prompt quality
  const analyzePrompt = (promptText: string): PromptAnalysis => {
    const words = promptText.trim().split(/\s+/);
    const sentences = promptText.split(/[.!?]+/).filter(s => s.trim());
    
    // Simple analysis metrics
    const clarity = Math.min(100, Math.max(0, 
      (words.length > 10 ? 50 : words.length * 5) + 
      (sentences.length > 1 ? 30 : 0) + 
      (promptText.includes('?') ? 20 : 0)
    ));
    
    const specificity = Math.min(100, Math.max(0,
      (words.length > 20 ? 60 : words.length * 3) +
      (promptText.match(/\b(specific|exactly|precisely|detailed)\b/gi)?.length || 0) * 10
    ));
    
    const structure = Math.min(100, Math.max(0,
      (sentences.length > 2 ? 40 : sentences.length * 20) +
      (promptText.match(/\b(first|second|then|finally|step)\b/gi)?.length || 0) * 15
    ));

    const suggestions = [];
    if (clarity < 60) suggestions.push("Add more context and clear instructions");
    if (specificity < 60) suggestions.push("Be more specific about desired output format");
    if (structure < 60) suggestions.push("Break down complex requests into steps");
    if (words.length < 10) suggestions.push("Provide more detailed requirements");

    return { clarity, specificity, structure, suggestions };
  };

  // Update analysis when prompt changes
  useEffect(() => {
    if (prompt.trim()) {
      setPromptAnalysis(analyzePrompt(prompt));
    } else {
      setPromptAnalysis(null);
    }
  }, [prompt]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Save prompt as template
  const saveAsTemplate = () => {
    if (!prompt.trim()) return;
    
    const template: PromptTemplate = {
      id: Date.now().toString(),
      name: `Template ${promptTemplates.length + 1}`,
      prompt: prompt.trim(),
      category: 'Custom',
      isFavorite: false,
      createdAt: new Date()
    };
    
    const updatedTemplates = [...promptTemplates, template];
    setPromptTemplates(updatedTemplates);
    localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates));
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const updatedFavorites = favorites.includes(id) 
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];
    
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  // Load template
  const loadTemplate = (template: PromptTemplate) => {
    setPrompt(template.prompt);
    setActiveTab('compose');
  };

  // Export data
  const exportData = () => {
    const data = {
      history: promptHistory,
      templates: promptTemplates,
      favorites: favorites,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-trainer-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.history) setPromptHistory(data.history);
        if (data.templates) setPromptTemplates(data.templates);
        if (data.favorites) setFavorites(data.favorites);
      } catch (err) {
        setError('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setPromptHistory([]);
      setPromptTemplates([]);
      setFavorites([]);
      localStorage.removeItem('promptHistory');
      localStorage.removeItem('promptTemplates');
      localStorage.removeItem('favorites');
    }
  };

  // Main API call function
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError('');
    setResponse('');
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const messages = [];
      if (systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://prompt-trainer.ai',
          'X-Title': 'AI Prompt Trainer',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        setResponse(aiResponse);
        setResponseTime(responseTimeMs);
        setTokenCount(data.usage?.total_tokens || 0);

        // Save to history
        const historyEntry: PromptHistory = {
          id: Date.now().toString(),
          prompt: prompt.trim(),
          response: aiResponse,
          timestamp: new Date(),
          temperature,
          maxTokens,
          responseTime: responseTimeMs,
          tokenCount: data.usage?.total_tokens || 0
        };

        const updatedHistory = [historyEntry, ...promptHistory.slice(0, 49)]; // Keep last 50
        setPromptHistory(updatedHistory);
        localStorage.setItem('promptHistory', JSON.stringify(updatedHistory));
      } else {
        throw new Error('Unexpected response format from API');
      }

    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-['Inter',sans-serif]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-8 border-b border-gray-200 pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-black rounded-2xl">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-black">
              Advanced Prompt Trainer
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            Professional-grade prompt engineering toolkit with advanced analytics, 
            template management, and comprehensive testing capabilities.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
          {[
            { id: 'compose', label: 'Compose', icon: FileText },
            { id: 'history', label: 'History', icon: History },
            { id: 'templates', label: 'Templates', icon: Save },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id 
                  ? 'text-black border-black' 
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* Compose Tab */}
            {activeTab === 'compose' && (
              <div className="space-y-6">
                
                {/* System Prompt */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <label className="block text-sm font-semibold text-black mb-3">
                    System Prompt (Optional)
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Define the AI's role and behavior..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm resize-none bg-white"
                  />
                </div>

                {/* Main Prompt */}
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-black">
                      Main Prompt
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveAsTemplate}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save Template
                      </button>
                      <button
                        onClick={() => setPrompt('')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here... Be specific and provide clear context for optimal results."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm resize-none"
                  />
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{prompt.length} characters</span>
                      <span>{prompt.trim().split(/\s+/).length} words</span>
                    </div>
                    {promptAnalysis && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Quality Score:</span>
                        <span className={`font-medium ${
                          Math.round((promptAnalysis.clarity + promptAnalysis.specificity + promptAnalysis.structure) / 3) > 70 
                            ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {Math.round((promptAnalysis.clarity + promptAnalysis.specificity + promptAnalysis.structure) / 3)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-black">Parameters</h3>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-black transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Advanced
                      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Temperature */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-600" />
                        <label className="text-sm font-medium text-black">
                          Temperature: {temperature}
                        </label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-600" />
                        <label className="text-sm font-medium text-black">
                          Max Tokens
                        </label>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="4000"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>

                    {/* Advanced Parameters */}
                    {showAdvanced && (
                      <>
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-black">
                            Top P: {topP}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={topP}
                            onChange={(e) => setTopP(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-black">
                            Frequency Penalty: {frequencyPenalty}
                          </label>
                          <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={frequencyPenalty}
                            onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-black">
                            Presence Penalty: {presencePenalty}
                          </label>
                          <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={presencePenalty}
                            onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Response...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Generate AI Response
                    </>
                  )}
                </button>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-black">Prompt History</h3>
                  <span className="text-sm text-gray-500">{promptHistory.length} entries</span>
                </div>
                
                {promptHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No history yet. Start by creating some prompts!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {promptHistory.map((entry) => (
                      <div key={entry.id} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">
                              {entry.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{entry.responseTime}ms</span>
                            <span>•</span>
                            <span>{entry.tokenCount} tokens</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-black mb-2">Prompt:</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {entry.prompt}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-black mb-2">Response:</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {entry.response}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Temp: {entry.temperature}</span>
                            <span>Tokens: {entry.maxTokens}</span>
                          </div>
                          <button
                            onClick={() => {
                              setPrompt(entry.prompt);
                              setActiveTab('compose');
                            }}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Reuse Prompt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-black">Prompt Templates</h3>
                  <span className="text-sm text-gray-500">{promptTemplates.length} templates</span>
                </div>
                
                {promptTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No templates yet. Save your first prompt as a template!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {promptTemplates.map((template) => (
                      <div key={template.id} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-black">{template.name}</h4>
                          <button
                            onClick={() => toggleFavorite(template.id)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            {favorites.includes(template.id) ? 
                              <Star className="w-4 h-4 fill-current text-yellow-500" /> : 
                              <StarOff className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {template.prompt}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{template.category}</span>
                          <button
                            onClick={() => loadTemplate(template)}
                            className="text-xs bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Use Template
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-black">Prompt Analysis</h3>
                
                {promptAnalysis ? (
                  <div className="space-y-6">
                    {/* Quality Metrics */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h4 className="font-medium text-black mb-4">Quality Metrics</h4>
                      <div className="space-y-4">
                        {[
                          { label: 'Clarity', value: promptAnalysis.clarity, color: 'bg-blue-500' },
                          { label: 'Specificity', value: promptAnalysis.specificity, color: 'bg-green-500' },
                          { label: 'Structure', value: promptAnalysis.structure, color: 'bg-purple-500' }
                        ].map(metric => (
                          <div key={metric.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-black">{metric.label}</span>
                              <span className="text-gray-600">{metric.value}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${metric.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${metric.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {promptAnalysis.suggestions.length > 0 && (
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="w-5 h-5 text-yellow-500" />
                          <h4 className="font-medium text-black">Improvement Suggestions</h4>
                        </div>
                        <ul className="space-y-2">
                          {promptAnalysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a prompt in the Compose tab to see analysis</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-black mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={exportData}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
                
                <label className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={clearAllData}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              </div>
            </div>

            {/* Model Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-5 h-5 text-black" />
                <h3 className="font-semibold text-black">Model Info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium text-black">DeepSeek Chat v3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium text-black">OpenRouter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                {responseTime > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Response:</span>
                    <span className="font-medium text-black">{responseTime}ms</span>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-black mb-4">Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-black">Auto-save prompts</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 text-sm">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="mt-8 bg-white rounded-2xl border-2 border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-black" />
                <h3 className="font-semibold text-black text-lg">AI Response</h3>
                {responseTime > 0 && (
                  <span className="text-sm text-gray-500">({responseTime}ms)</span>
                )}
              </div>
              <button
                onClick={() => copyToClipboard(response)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-xl transition-colors text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Response
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-black whitespace-pre-wrap leading-relaxed text-sm">
                {response}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;