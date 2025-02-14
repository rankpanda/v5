import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { KDIndicator } from './KDIndicator';

interface Keyword {
  keyword: string;
  volume: number;
  difficulty: number;
  kgr?: number | null;
  autoSuggestions?: string[];
  contentType?: string;
  searchIntent?: string;
  funnelStage?: string;
  priority?: number;
  potentialTraffic?: number;
  potentialConversions?: number;
  potentialRevenue?: number;
}

interface KeywordTableProps {
  keywords: Keyword[];
  selectedKeywords: Set<string>;
  onToggleKeyword: (keyword: string) => void;
  onToggleAll: (selected: boolean) => void;
  contextData: {
    conversionRate: number;
    averageOrderValue: number;
  };
}

export function KeywordTable({
  keywords,
  selectedKeywords,
  onToggleKeyword,
  onToggleAll,
  contextData
}: KeywordTableProps) {
  const allSelected = keywords.length > 0 && keywords.every(kw => selectedKeywords.has(kw.keyword));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="sticky left-0 px-6 py-4 w-10 bg-gray-50">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
              />
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <span>Keyword</span>
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Volume
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              KD
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              KGR
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Auto Suggest
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Content Type
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Search Intent
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Funnel Stage
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pot. Traffic
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pot. Conv.
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pot. Revenue
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keywords.map((kw) => {
            const isSelected = selectedKeywords.has(kw.keyword);
            
            return (
              <tr key={kw.keyword} className={`hover:bg-gray-50 ${isSelected ? 'bg-secondary-lime/10' : ''}`}>
                <td className="sticky left-0 px-6 py-4 bg-white">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleKeyword(kw.keyword)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 font-medium">{kw.keyword}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.volume.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <KDIndicator kd={kw.difficulty} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.kgr?.toFixed(2) || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {kw.autoSuggestions?.join(', ') || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.contentType || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.searchIntent || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.funnelStage || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.priority || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.potentialTraffic?.toLocaleString() || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{kw.potentialConversions?.toLocaleString() || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {kw.potentialRevenue ? formatCurrency(kw.potentialRevenue) : '-'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}