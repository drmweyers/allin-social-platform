'use client'

/**
 * Knowledge Search Box Component
 *
 * Dedicated search interface for querying the AllIN Platform knowledge base.
 * Shows retrieved chunks with collapsible context for detailed information.
 */

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'

interface RetrievedChunk {
  id: string
  path: string
  title: string
  section?: string
  content: string
  category?: string
  score: number
  citations: string[]
}

interface KnowledgeSearchBoxProps {
  onResultSelect?: (chunk: RetrievedChunk) => void
  placeholder?: string
  className?: string
}

export default function KnowledgeSearchBox({
  onResultSelect,
  placeholder = "Search AllIN Platform documentation...",
  className = ""
}: KnowledgeSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<RetrievedChunk[]>([])
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const { toast } = useToast()

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'troubleshooting', label: 'Troubleshooting' },
    { value: 'faq', label: 'FAQ' },
    { value: 'features-apis', label: 'Features & APIs' },
    { value: 'user-journeys', label: 'User Journeys' },
    { value: 'configuration', label: 'Configuration' },
    { value: 'security-privacy', label: 'Security & Privacy' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'roadmap', label: 'Roadmap' }
  ]

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('/api/ai/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k: 10,
          category: selectedCategory || undefined,
          minScore: 0.6
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data.data.results)
      setExpandedResults(new Set()) // Collapse all on new search

    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Unable to search the knowledge base. Please try again.',
        variant: 'destructive'
      })
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const toggleExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId)
    } else {
      newExpanded.add(resultId)
    }
    setExpandedResults(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    })
  }

  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text

    const terms = searchQuery.toLowerCase().split(/\\s+/)
    let highlightedText = text

    terms.forEach(term => {
      if (term.length > 2) {
        const regex = new RegExp(`(${term})`, 'gi')
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
        )
      }
    })

    return highlightedText
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'troubleshooting': 'bg-red-100 text-red-800',
      'faq': 'bg-blue-100 text-blue-800',
      'features-apis': 'bg-green-100 text-green-800',
      'configuration': 'bg-purple-100 text-purple-800',
      'security-privacy': 'bg-orange-100 text-orange-800',
      'architecture': 'bg-gray-100 text-gray-800',
      'roadmap': 'bg-indigo-100 text-indigo-800'
    }
    return colors[category || ''] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Knowledge Search
          </CardTitle>
          <CardDescription>
            Search through AllIN Platform documentation for specific information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="flex-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="px-6"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Stats */}
          {results.length > 0 && (
            <div className="text-sm text-gray-600">
              Found {results.length} results for "{query}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          {result.title}
                        </h3>
                        {result.section && (
                          <p className="text-sm text-gray-600 mt-1">
                            {result.section}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={`text-xs ${getScoreColor(result.score)}`}>
                          {Math.round(result.score * 100)}%
                        </Badge>
                        {result.category && (
                          <Badge variant="secondary" className={`text-xs ${getCategoryColor(result.category)}`}>
                            {result.category.replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="text-sm text-gray-700">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerms(
                            result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
                            query
                          )
                        }}
                      />
                    </div>

                    {/* Expandable Content */}
                    <Collapsible
                      open={expandedResults.has(result.id)}
                      onOpenChange={() => toggleExpanded(result.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between p-2">
                          <span className="text-sm">
                            {expandedResults.has(result.id) ? 'Hide' : 'Show'} full content
                          </span>
                          {expandedResults.has(result.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        {/* Full Content */}
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div
                            className="text-sm prose prose-sm max-w-none whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerms(result.content, query)
                            }}
                          />
                        </div>

                        {/* Citations */}
                        {result.citations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">References:</h4>
                            <div className="flex flex-wrap gap-1">
                              {result.citations.map((citation, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {citation}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.content)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          {onResultSelect && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResultSelect(result)}
                            >
                              Use in Response
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open documentation link (if available)
                              toast({
                                title: 'Documentation Reference',
                                description: `Source: ${result.path}`,
                              })
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>{result.path}</span>
                      <span>{result.content.length} characters</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* No Results */}
      {query && results.length === 0 && !isSearching && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or selecting a different category.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('login issues')}
              >
                Login Issues
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('API documentation')}
              >
                API Docs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('troubleshooting')}
              >
                Troubleshooting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!query && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search the Knowledge Base</h3>
            <p className="text-gray-600 mb-4">
              Enter your search terms above to find relevant documentation.
            </p>
            <div className="text-sm text-gray-500">
              <p><strong>Tips:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Use specific terms like "OAuth authentication" or "rate limiting"</li>
                <li>Try category filters for more focused results</li>
                <li>Search for error messages or specific features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}