import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Save, RefreshCw, Upload } from 'lucide-react';
import { KeywordTable } from './KeywordTable';
import { FunnelAnalysis } from './FunnelAnalysis';
import { KeywordStats } from './KeywordStats';
import { toast } from './ui/Toast';
import { getGoogleSuggestions } from '../services/autoSuggestService';
import { parseCSV } from '../utils/csvParser';

interface Keyword {
  keyword: string;
  volume: number;
  difficulty: number;
  kgr?: number;
  autoSuggestions?: string[];
  contentType?: string;
  searchIntent?: string;
  funnelStage?: string;
  priority?: number;
  potentialTraffic?: number;
  potentialConversions?: number;
  potentialRevenue?: number;
}

export function TierKeywords() {
  const { tierId } = useParams<{ tierId: string }>();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stats, setStats] = useState({
    totalVolume: 0,
    avgDifficulty: 0,
    totalTraffic: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [contextData, setContextData] = useState({
    conversionRate: 2,
    averageOrderValue: 125,
    language: 'pt-PT'
  });

  useEffect(() => {
    loadInitialData();
  }, [tierId]);

  const loadInitialData = async () => {
    try {
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        toast.error('No project selected');
        return;
      }

      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const project = projects.find((p: any) => p.id === projectId);
      
      if (!project) {
        toast.error('Project not found');
        return;
      }

      // Load context data
      if (project.context) {
        setContextData(project.context);
      }

      // Load tier keywords
      const tierKey = `tier${tierId}Keywords`;
      if (project.data?.[tierKey]) {
        setKeywords(project.data[tierKey]);
        updateStats(project.data[tierKey]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (keywordList: Keyword[]) => {
    const totalVolume = keywordList.reduce((sum, kw) => sum + kw.volume, 0);
    const avgDifficulty = Math.round(keywordList.reduce((sum, kw) => sum + kw.difficulty, 0) / keywordList.length) || 0;
    const totalTraffic = keywordList.reduce((sum, kw) => sum + (kw.potentialTraffic || 0), 0);
    const totalRevenue = keywordList.reduce((sum, kw) => sum + (kw.potentialRevenue || 0), 0);

    setStats({ totalVolume, avgDifficulty, totalTraffic, totalRevenue });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      const rows = parseCSV(text);

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const keywordIdx = headers.findIndex(h => h.includes('keyword') || h.includes('term'));
      const volumeIdx = headers.findIndex(h => h.includes('volume') || h.includes('search volume'));
      const difficultyIdx = headers.findIndex(h => h.includes('difficulty') || h.includes('kd'));

      if (keywordIdx === -1 || volumeIdx === -1 || difficultyIdx === -1) {
        toast.error('Required columns not found. Please check your CSV format.');
        return;
      }

      // Process keywords and get suggestions
      const processedKeywords = await Promise.all(rows.slice(1)
        .filter(row => row[keywordIdx]?.trim())
        .map(async row => {
          const keyword = row[keywordIdx].trim();
          const volume = parseInt(row[volumeIdx].replace(/[^\d]/g, '')) || 0;
          const difficulty = parseInt(row[difficultyIdx].replace(/[^\d]/g, '')) || 0;

          // Calculate metrics
          const potentialTraffic = Math.round(volume * 0.32);
          const potentialConversions = Math.round(potentialTraffic * (contextData.conversionRate / 100));
          const potentialRevenue = Math.round(potentialConversions * contextData.averageOrderValue);

          // Get suggestions for the keyword
          const suggestions = await getGoogleSuggestions(keyword, contextData.language);

          return {
            keyword,
            volume,
            difficulty,
            autoSuggestions: suggestions,
            potentialTraffic,
            potentialConversions,
            potentialRevenue,
            contentType: '',
            searchIntent: '',
            funnelStage: '',
            priority: 0,
            kgr: 0
          };
        }));

      // Save to project
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        toast.error('No project selected');
        return;
      }

      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const projectIndex = projects.findIndex(p => p.id === projectId);

      if (projectIndex === -1) {
        toast.error('Project not found');
        return;
      }

      const tierKey = `tier${tierId}Keywords`;
      projects[projectIndex].data[tierKey] = processedKeywords;
      localStorage.setItem('projects', JSON.stringify(projects));
      
      setKeywords(processedKeywords);
      updateStats(processedKeywords);
      toast.success(`${processedKeywords.length} keywords imported successfully`);
    } catch (error) {
      console.error('Error importing keywords:', error);
      toast.error('Error importing keywords. Please check your file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAutoSuggestions = (keyword: string, suggestions: string) => {
    const updatedKeywords = keywords.map(kw => {
      if (kw.keyword === keyword) {
        return {
          ...kw,
          autoSuggestions: suggestions.split(',').map(s => s.trim()).filter(Boolean)
        };
      }
      return kw;
    });

    setKeywords(updatedKeywords);

    // Save to project
    const projectId = localStorage.getItem('currentProjectId');
    if (projectId) {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const projectIndex = projects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        const tierKey = `tier${tierId}Keywords`;
        projects[projectIndex].data[tierKey] = updatedKeywords;
        localStorage.setItem('projects', JSON.stringify(projects));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Tier {tierId} Keywords</h1>
        <label className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 cursor-pointer transition-colors">
          <Upload className="h-4 w-4 mr-2" />
          Import Keywords
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <KeywordStats stats={stats} />

      <FunnelAnalysis keywords={keywords} contextData={contextData} />

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="sticky top-0 p-4 bg-white border-b border-gray-200 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Keywords</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Save changes
                  const projectId = localStorage.getItem('currentProjectId');
                  if (projectId) {
                    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                    const projectIndex = projects.findIndex(p => p.id === projectId);
                    if (projectIndex !== -1) {
                      const tierKey = `tier${tierId}Keywords`;
                      projects[projectIndex].data[tierKey] = keywords;
                      localStorage.setItem('projects', JSON.stringify(projects));
                      toast.success('Changes saved successfully');
                    }
                  }
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#11190c] rounded-md hover:bg-[#0a0f07] transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <KeywordTable
          keywords={keywords}
          selectedKeywords={selectedKeywords}
          onToggleKeyword={(keyword) => {
            const newSelection = new Set(selectedKeywords);
            if (newSelection.has(keyword)) {
              newSelection.delete(keyword);
            } else {
              newSelection.add(keyword);
            }
            setSelectedKeywords(newSelection);
          }}
          onToggleAll={(selected) => {
            if (selected) {
              setSelectedKeywords(new Set(keywords.map(kw => kw.keyword)));
            } else {
              setSelectedKeywords(new Set());
            }
          }}
          onUpdateAutoSuggestions={handleUpdateAutoSuggestions}
          contextData={contextData}
        />
      </div>
    </div>
  );
}