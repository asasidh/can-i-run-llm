import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import axios from 'axios'
import Select from 'react-select'
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  // Add console log to check component mounting
  console.log('App component rendering')
  
  // State for hardware specs
  const [computerType, setComputerType] = useState('mac')
  const [macRam, setMacRam] = useState(null)
  const [cpu, setCpu] = useState(null)
  const [gpu, setGpu] = useState(null)
  const [ram, setRam] = useState(null)
  
  // State for LLM model
  const [selectedModel, setSelectedModel] = useState(null)
  const [models, setModels] = useState([])
  const [canRun, setCanRun] = useState(null)
  const [alternativeModels, setAlternativeModels] = useState([])
  
  // Add missing states
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Mac RAM options
  const macRamOptions = [
    { value: 8, label: '8GB RAM', ram: 8 },
    { value: 16, label: '16GB RAM', ram: 16 },
    { value: 24, label: '24GB RAM', ram: 24 },
    { value: 32, label: '32GB RAM', ram: 32 },
    { value: 48, label: '48GB RAM', ram: 48 }, // Fixed label
    { value: 64, label: '64GB RAM', ram: 64 },
    { value: 96, label: '96GB RAM', ram: 96 },
    { value: 128, label: '128GB RAM', ram: 128 },
    { value: 192, label: '192GB RAM', ram: 192 },
    { value: 512, label: '512GB RAM', ram: 512 },
  ]
  
  const cpuOptions = [
    { value: 'intel-i5', label: 'Intel Core i5', performance: 5 },
    { value: 'intel-i7', label: 'Intel Core i7', performance: 7 },
    { value: 'intel-i9', label: 'Intel Core i9', performance: 9 },
    { value: 'amd-ryzen-5', label: 'AMD Ryzen 5', performance: 5 },
    { value: 'amd-ryzen-7', label: 'AMD Ryzen 7', performance: 7 },
    { value: 'amd-ryzen-9', label: 'AMD Ryzen 9', performance: 9 },
  ]
  
  const gpuOptions = [
    { value: 'none', label: 'No dedicated GPU', vram: 0 },
    { value: 'nvidia-rtx-3060', label: 'NVIDIA RTX 3060', vram: 12 },
    { value: 'nvidia-rtx-3070', label: 'NVIDIA RTX 3070', vram: 8 },
    { value: 'nvidia-rtx-3080', label: 'NVIDIA RTX 3080', vram: 10 },
    { value: 'nvidia-rtx-3090', label: 'NVIDIA RTX 3090', vram: 24 },
    { value: 'nvidia-rtx-4060', label: 'NVIDIA RTX 4060', vram: 8 },
    { value: 'nvidia-rtx-4070', label: 'NVIDIA RTX 4070', vram: 12 },
    { value: 'nvidia-rtx-4080', label: 'NVIDIA RTX 4080', vram: 16 },
    { value: 'nvidia-rtx-4090', label: 'NVIDIA RTX 4090', vram: 24 },
    { value: 'amd-rx-6700-xt', label: 'AMD RX 6700 XT', vram: 12 },
    { value: 'amd-rx-6800-xt', label: 'AMD RX 6800 XT', vram: 16 },
    { value: 'amd-rx-6900-xt', label: 'AMD RX 6900 XT', vram: 16 },
    { value: 'amd-rx-7900-xt', label: 'AMD RX 7900 XT', vram: 20 },
  ]
  
  const ramOptions = [
    { value: 8, label: '8GB RAM', ram: 8 },
    { value: 16, label: '16GB RAM', ram: 16 },
    { value: 32, label: '32GB RAM', ram: 32 },
    { value: 64, label: '64GB RAM', ram: 64 },
    { value: 128, label: '128GB RAM', ram: 128 },
  ]
  
  // Initial models data as fallback
  const initialModels = [
    { 
      value: 'llama-2-7b', 
      label: 'Llama-2 7B', 
      ramRequired: 16, 
      vramRequired: 8,
      url: 'https://huggingface.co/meta-llama/Llama-2-7b'
    },
    { 
      value: 'llama-2-13b', 
      label: 'Llama-2 13B', 
      ramRequired: 32, 
      vramRequired: 16,
      url: 'https://huggingface.co/meta-llama/Llama-2-13b'
    },
    { 
      value: 'llama-2-70b', 
      label: 'Llama-2 70B', 
      ramRequired: 64, 
      vramRequired: 40,
      url: 'https://huggingface.co/meta-llama/Llama-2-70b'
    },
    { 
      value: 'falcon-7b', 
      label: 'Falcon 7B', 
      ramRequired: 16, 
      vramRequired: 8,
      url: 'https://huggingface.co/tiiuae/falcon-7b'
    },
    { 
      value: 'falcon-40b', 
      label: 'Falcon 40B', 
      ramRequired: 48, 
      vramRequired: 40,
      url: 'https://huggingface.co/tiiuae/falcon-40b'
    },
    { 
      value: 'mistral-7b', 
      label: 'Mistral 7B', 
      ramRequired: 16, 
      vramRequired: 8,
      url: 'https://huggingface.co/mistralai/Mistral-7B-v0.1'
    },
    { 
      value: 'mixtral-8x7b', 
      label: 'Mixtral 8x7B', 
      ramRequired: 64, 
      vramRequired: 32,
      url: 'https://huggingface.co/mistralai/Mixtral-8x7B-v0.1'
    },
  ]
  
  // Function to estimate resource requirements based on model size
  const estimateRequirements = (modelId) => {
    // Extract size from model name if available (e.g., "7b", "13b")
    const sizeMatch = modelId.toLowerCase().match(/[-_](\d+)b/i);
    const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
    
    let ramRequired = 16; // Default minimum
    let vramRequired = 8; // Default minimum
    
    if (size) {
      if (size <= 3) {
        ramRequired = 8;
        vramRequired = 4;
      } else if (size <= 7) {
        ramRequired = 16;
        vramRequired = 8;
      } else if (size <= 13) {
        ramRequired = 32;
        vramRequired = 16;
      } else if (size <= 30) {
        ramRequired = 48;
        vramRequired = 32;
      } else if (size <= 70) {
        ramRequired = 80;
        vramRequired = 70;
      } else {
        ramRequired = 128;
        vramRequired = 80;
      }
    }
    
    return { ramRequired, vramRequired };
  }
  
  // Add caching mechanism
  const fetchModelsWithCache = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we have cached data and it's less than 24 hours old
      const cachedData = localStorage.getItem('modelCache');
      const cacheTimestamp = localStorage.getItem('modelCacheTimestamp');
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      // Use cached data if available and fresh
      if (cachedData && cacheAge < CACHE_DURATION) {
        console.log('Using cached model data');
        setModels(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }
      
      // Set initial models first for immediate display
      setModels(initialModels);
      
      // Use a CORS proxy if needed
      const apiUrl = 'https://huggingface.co/api/models';
      const params = {
        sort: 'downloads',
        limit: 50,
        filter: 'text-generation'
      };
      
      // Add cache-busting parameter
      const response = await axios.get(apiUrl, {
        params: {
          ...params,
          _: Date.now() // Cache-busting
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.data) {
        // Process the API response
        const apiModels = response.data.map(model => {
          const { ramRequired, vramRequired } = estimateRequirements(model.id);
          
          return {
            value: model.id,
            label: model.id.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            ramRequired,
            vramRequired,
            url: `https://huggingface.co/${model.id}`
          };
        });
        
        // Sort by name
        apiModels.sort((a, b) => a.label.localeCompare(b.label));
        
        // Cache the results
        localStorage.setItem('modelCache', JSON.stringify(apiModels));
        localStorage.setItem('modelCacheTimestamp', Date.now().toString());
        
        setModels(apiModels);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models. Using fallback data.');
      
      // Use fallback data if API fails
      if (models.length === 0) {
        setModels(initialModels);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialModels]);
  
  // Load models on component mount
  useEffect(() => {
    fetchModelsWithCache();
  }, [fetchModelsWithCache]);
  
  // Add a refresh function for manual updates
  const refreshModels = () => {
    // Clear cache and fetch fresh data
    localStorage.removeItem('modelCache');
    localStorage.removeItem('modelCacheTimestamp');
    fetchModelsWithCache();
  };
  
  // Add quantization options state
  const [quantization, setQuantization] = useState('full');
  
  // Function to check if the selected model can run on the specified hardware
  const checkCompatibility = () => {
    if (!selectedModel) {
      alert('Please select an LLM model')
      return
    }
    
    let userRam = 0
    let userVram = 0
    
    if (computerType === 'mac') {
      if (!macRam) {
        alert('Please select your Mac RAM')
        return
      }
      userRam = macRam.ram
      // Mac GPUs are integrated, so we'll use RAM as VRAM for simplicity
      userVram = macRam.ram / 2 // Simplified assumption
    } else {
      if (!gpu || !ram) {
        alert('Please select GPU and RAM options')
        return
      }
      userRam = ram.ram
      userVram = gpu.vram
    }
    
    // Check if the user's hardware meets the requirements
    const canRunResult = userRam >= selectedModel.ramRequired && 
                        (userVram >= selectedModel.vramRequired || computerType === 'mac')
    
    // Generate reasoning
    // Generate reasoning with more specific model size information
    let reasoning = '';
    if (canRunResult) {
      reasoning = `Your system has sufficient resources (${userRam}GB RAM`;
      if (computerType === 'pc') {
        reasoning += `, ${userVram}GB VRAM`;
      }
      
      // Add specific information about model variants
      if (selectedModel.value.includes('deepseek') || 
          selectedModel.value.includes('llama') || 
          selectedModel.value.includes('mixtral')) {
        
        // Determine which version they can likely run
        let sizeInfo = '';
        if (userRam >= 80 && (userVram >= 70 || computerType === 'mac')) {
          sizeInfo = 'full-size version';
        } else if (userRam >= 32 && (userVram >= 16 || computerType === 'mac')) {
          sizeInfo = 'medium-sized variant (likely 13B parameters)';
        } else {
          sizeInfo = 'smaller distilled version (likely 7B parameters or less)';
        }
        
        reasoning += `) to run the ${sizeInfo} of this model.`;
      } else {
        reasoning += `) to run this model.`;
      }
    } else {
      if (userRam < selectedModel.ramRequired) {
        reasoning += `Insufficient RAM: You have ${userRam}GB but need ${selectedModel.ramRequired}GB. `;
      }
      if (computerType === 'pc' && userVram < selectedModel.vramRequired) {
        reasoning += `Insufficient VRAM: You have ${userVram}GB but need ${selectedModel.vramRequired}GB. `;
      }
      reasoning += 'Consider using a smaller model.';
    }
    
    setCanRun({result: canRunResult, reasoning: reasoning});
    
    // Find alternative models that can run on this hardware
    const alternatives = models.filter(model => 
      model.value !== selectedModel.value && 
      userRam >= model.ramRequired && 
      (userVram >= model.vramRequired || computerType === 'mac')
    ).slice(0, 5); // Limit to 5 alternatives
    
    setAlternativeModels(alternatives);
  }
  
  return (
    <div className="app-container">
      {error && (
        <div style={{ color: 'red', padding: '20px', border: '1px solid red', margin: '20px' }}>
          Error: {error}
        </div>
      )}
      
      <header>
        <h1>Can I Run This LLM?</h1>
        <p>Find out if your computer can run popular Large Language Models</p>
      </header>
      
      <main>
        <div className="sections-container">
          {/* "If I Have" Section */}
          <section className="hardware-section">
            <h2>If I Have</h2>
            
            <div className="form-group">
              <label>Computer Type</label>
              <div className="computer-type-selector">
                <button 
                  className={computerType === 'mac' ? 'active' : ''}
                  onClick={() => setComputerType('mac')}
                >
                  Mac
                </button>
                <button 
                  className={computerType === 'pc' ? 'active' : ''}
                  onClick={() => setComputerType('pc')}
                >
                  PC
                </button>
              </div>
            </div>
            
            {computerType === 'mac' ? (
              <div className="form-group">
                <label>Mac RAM (Apple Silicon / M-series only)</label>
                <Select
                  options={macRamOptions}
                  value={macRam}
                  onChange={setMacRam}
                  placeholder="Select your Mac RAM..."
                  className="select-input"
                />
                <small className="helper-text">This tool is for Apple Silicon Macs only</small>
              </div>
            ) : (
              <>
                {/* Removed CPU selection since it's not used in calculations */}
                
                <div className="form-group">
                  <label>GPU</label>
                  <Select
                    options={gpuOptions}
                    value={gpu}
                    onChange={setGpu}
                    placeholder="Select your GPU..."
                    className="select-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>RAM</label>
                  <Select
                    options={ramOptions}
                    value={ram}
                    onChange={setRam}
                    placeholder="Select your RAM..."
                    className="select-input"
                  />
                </div>
              </>
            )}
          </section>
          
          {/* "Can I Run" Section */}
          <section className="model-section">
            <h2>Can I Run</h2>
            
            <div className="form-group">
              <label>LLM Model</label>
              <div className="model-select-container">
                <Select
                  options={models}
                  value={selectedModel}
                  onChange={setSelectedModel}
                  placeholder={isLoading ? "Loading models..." : "Select an LLM model..."}
                  className="select-input"
                  isLoading={isLoading}
                />
                <button 
                  className="refresh-button" 
                  onClick={refreshModels}
                  disabled={isLoading}
                  title="Refresh model list"
                >
                  ↻
                </button>
              </div>
              {isLoading && <small className="helper-text">Fetching latest model information...</small>}
            </div>
            
            <button 
              className="check-button"
              onClick={checkCompatibility}
              disabled={!selectedModel || (computerType === 'mac' && !macRam) || (computerType === 'pc' && (!gpu || !ram))}
            >
              Check Compatibility
            </button>
            
            {/* Results Display */}
            {canRun !== null && (
              <div className={`result-container ${canRun.result ? 'success' : 'error'}`}>
                <h3>{canRun.result ? 'Yes, you can run this model!' : 'No, your hardware is insufficient'}</h3>
                <p>{canRun.reasoning}</p>
                
                {alternativeModels.length > 0 && !canRun.result && (
                  <div className="alternatives">
                    <h4>Alternative models you can run:</h4>
                    <ul>
                      {alternativeModels.map(model => (
                        <li key={model.value}>
                          <a href={model.url} target="_blank" rel="noopener noreferrer">
                            {model.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      
      <footer>
        <p>This tool provides estimates based on general requirements. Actual performance may vary.</p>
        <p>Data sourced from HuggingFace and model documentation.</p>
      </footer>
      
      {/* Add Vercel Analytics */}
      <Analytics />
    </div>
  )
}