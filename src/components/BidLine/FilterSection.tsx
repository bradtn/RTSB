import React from 'react';
import { ChevronRight, Filter, Search, X } from 'lucide-react';
import ModernToggle from '@/components/UI/ModernToggle';
import ModernSelect from '@/components/UI/ModernSelect';
import { BidLineStatus, SortByOption, CategoryFilterMode } from '@/types/BidLinesClient.types';
import { BID_LINE_CATEGORIES } from '@/constants/bidLineCategories';
import { getLocalizedCategoryName } from '@/utils/localization';

interface FilterSectionProps {
  isFiltersExpanded: boolean;
  setIsFiltersExpanded: (expanded: boolean) => void;
  selectedOperation: string;
  setSelectedOperation: (operation: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: BidLineStatus;
  setSelectedStatus: (status: BidLineStatus) => void;
  sortBy: SortByOption;
  setSortBy: (sort: SortByOption) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  categoryFilterMode: CategoryFilterMode;
  setCategoryFilterMode: (mode: CategoryFilterMode) => void;
  operations: any[];
  clearFilters: () => void;
  locale: string;
  t: (key: string, params?: any) => string;
}

export default function FilterSection({
  isFiltersExpanded,
  setIsFiltersExpanded,
  selectedOperation,
  setSelectedOperation,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  selectedCategories,
  setSelectedCategories,
  categoryFilterMode,
  setCategoryFilterMode,
  operations,
  clearFilters,
  locale,
  t,
}: FilterSectionProps) {
  return (
    <div className="mb-6 sm:mb-8 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Collapsible Header */}
      <div className={`w-full px-6 py-4 flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-all duration-300 hover:shadow-md group ${isFiltersExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}>
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="flex items-center gap-3 flex-1"
        >
          <ChevronRight 
            className={`h-5 w-5 text-green-600 dark:text-green-400 transition-all duration-300 group-hover:text-green-700 dark:group-hover:text-green-300 ${
              isFiltersExpanded ? 'rotate-90' : 'rotate-0'
            }`} 
          />
          <Filter className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('common.filterOptions')}</h2>
        </button>
        <div className="flex items-center gap-3">
          {(selectedOperation !== 'all' || selectedStatus !== 'all' || searchTerm !== '' || selectedCategories.length > 0 || sortBy !== 'default') && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-all duration-300"
            >
              <X className="h-4 w-4" />
              {t('bidLine.clearAll')}
            </button>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isFiltersExpanded ? t('bidLine.clickToCollapse') : t('bidLine.clickToExpand')}
          </span>
        </div>
      </div>

      {/* Collapsible Content */}
      {isFiltersExpanded && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Operation Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                {t('common.operation')}
              </label>
              <ModernSelect
                value={selectedOperation}
                onChange={(value) => {
                  console.log('Operation changed to:', value);
                  setSelectedOperation(value);
                }}
                options={[
                  { value: 'all', label: t('bidLine.allOperations') },
                  ...(operations?.map((op: any) => ({
                    value: op.id,
                    label: locale === 'fr' ? op.nameFr : op.nameEn
                  })) || [])
                ]}
              />
            </div>

            {/* Search Lines */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                {t('bidLine.searchLines')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('bidLine.searchByDetails')}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                {t('common.status')}
              </label>
              <ModernSelect
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value as BidLineStatus)}
                options={[
                  { value: 'all', label: t('bidLine.allStatus') },
                  { value: 'AVAILABLE', label: t('bidLine.available') },
                  { value: 'TAKEN', label: t('bidLine.taken') },
                  { value: 'BLACKED_OUT', label: t('bidLine.blackedOut') }
                ]}
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                {t('bidLine.sortBy')}
              </label>
              <ModernSelect
                value={sortBy}
                onChange={(value) => setSortBy(value as SortByOption)}
                options={[
                  { value: 'default', label: t('bidLine.sortDefault') },
                  { value: 'dayOffMatch', label: t('bidLine.sortDayOffMatch') }
                ]}
              />
            </div>
          </div>

          {/* Shift Categories Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {t('bidLine.shiftCategories')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedCategories.length > 0 ? t('bidLine.categoriesSelected', { count: selectedCategories.length.toString() }) : t('bidLine.filterByCategories')}
                </p>
              </div>
              {selectedCategories.length > 1 && (
                <ModernToggle
                  isOn={categoryFilterMode === 'AND'}
                  onToggle={() => setCategoryFilterMode(categoryFilterMode === 'OR' ? 'AND' : 'OR')}
                  leftLabel={locale === 'fr' ? "QUELCONQUE" : "ANY"}
                  rightLabel={locale === 'fr' ? "EXACTE" : "EXACT"}
                  tooltip={categoryFilterMode === 'AND' 
                    ? (locale === 'fr' ? "Doit correspondre à TOUTES les catégories sélectionnées" : "Must match ALL selected categories")
                    : (locale === 'fr' ? "Doit correspondre à AU MOINS UNE des catégories sélectionnées" : "Must match at least ONE selected category")
                  }
                />
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {BID_LINE_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    if (selectedCategories.includes(category)) {
                      setSelectedCategories(selectedCategories.filter(c => c !== category));
                    } else {
                      setSelectedCategories([...selectedCategories, category]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {getLocalizedCategoryName(category, locale)}
                </button>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                </span>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
                >
                  {t('bidLine.clearAll')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}