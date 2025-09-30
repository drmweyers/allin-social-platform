'use client'

/**
 * AllIN Platform Support Assistant Page
 *
 * Internal support dashboard with AI-powered assistance for customer support staff.
 * Features document search, AI-powered Q&A, and escalation to human support.
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Search, MessageSquare, ExternalLink, Copy, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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

interface AIAnswer {
  answer: string
  confidence: number
  sources: RetrievedChunk[]
  escalateToHuman: boolean
  reasoning?: string
  responseTime: number
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sources?: RetrievedChunk[]
  confidence?: number
  escalateToHuman?: boolean
}

export default function SupportAssistantPage() {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<RetrievedChunk[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to the AllIN Platform Support Assistant. I can help you find information and answer customer questions using our knowledge base.',
      timestamp: new Date()
    }
  ])
  const [showPrompt, setShowPrompt] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/ai/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          k: 8,
          category: selectedCategory || undefined,
          minScore: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.data.results)
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Unable to search the knowledge base. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!query.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          userRole: 'support_staff', // Internal support staff role
          featureContext: 'support_dashboard'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get answer')
      }

      const data: { data: AIAnswer } = await response.json()
      const answer = data.data

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: answer.answer,
        timestamp: new Date(),
        sources: answer.sources,
        confidence: answer.confidence,
        escalateToHuman: answer.escalateToHuman
      }

      setChatMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error while processing your question. Please try again or contact technical support.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId: messageId,
          helpful
        })
      })

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! This helps improve our AI assistant.',
      })
    } catch (error) {
      toast({
        title: 'Feedback Failed',
        description: 'Unable to submit feedback. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleEscalate = async (messageId: string, reason: string) => {
    try {
      await fetch('/api/ai/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId: messageId,
          reason,
          urgency: 'medium'
        })
      })

      toast({
        title: 'Escalated to Human Support',
        description: 'This query has been escalated and a support ticket has been created.',
      })
    } catch (error) {
      toast({
        title: 'Escalation Failed',
        description: 'Unable to escalate. Please contact support directly.',
        variant: 'destructive'
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Response copied to clipboard',
    })
  }

  const formatConfidence = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'bg-green-500' }
    if (confidence >= 0.6) return { label: 'Medium', color: 'bg-yellow-500' }
    return { label: 'Low', color: 'bg-red-500' }
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Assistant</h1>
          <p className="text-gray-600">AI-powered support for customer inquiries</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPrompt(!showPrompt)}
          className="hidden md:flex"
        >
          {showPrompt ? 'Hide' : 'Show'} Prompt
        </Button>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="search">Knowledge Search</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Assistant
              </CardTitle>
              <CardDescription>
                Ask questions and get AI-powered responses based on our documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : message.type === 'system'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>

                        {message.type === 'assistant' && (
                          <div className="mt-3 space-y-2">
                            {/* Confidence Badge */}
                            {message.confidence !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Confidence:</span>
                                <Badge
                                  variant="secondary"
                                  className={`text-white ${formatConfidence(message.confidence).color}`}
                                >
                                  {formatConfidence(message.confidence).label} ({Math.round(message.confidence * 100)}%)
                                </Badge>
                              </div>
                            )}

                            {/* Escalation Warning */}
                            {message.escalateToHuman && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Consider escalating to human support</span>
                              </div>
                            )}

                            {/* Sources */}
                            {message.sources && message.sources.length > 0 && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="p-0 h-auto text-sm">
                                    View Sources ({message.sources.length})
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2">
                                  {message.sources.map((source) => (
                                    <div key={source.id} className="text-xs bg-gray-50 p-2 rounded">
                                      <div className="font-medium">{source.title}</div>
                                      {source.section && (
                                        <div className="text-gray-600">{source.section}</div>
                                      )}
                                      <div className="text-gray-500">
                                        {source.path} • Score: {Math.round(source.score * 100)}%
                                      </div>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(message.content)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, true)}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, false)}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                              {message.escalateToHuman && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEscalate(message.id, 'AI suggested escalation')}
                                >
                                  Escalate
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="animate-pulse">Thinking...</div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a question about AllIN Platform..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAskQuestion()
                    }
                  }}
                  className="resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!query.trim() || isLoading}
                  size="icon"
                  className="h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="flex-1 flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Knowledge Search
              </CardTitle>
              <CardDescription>
                Search documentation directly for specific information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  className="px-3 py-2 border rounded-md"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{result.title}</h3>
                          <Badge variant="outline">
                            {Math.round(result.score * 100)}% match
                          </Badge>
                        </div>
                        {result.section && (
                          <p className="text-sm text-gray-600">{result.section}</p>
                        )}
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {result.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{result.path}</span>
                          {result.category && (
                            <Badge variant="secondary" className="text-xs">
                              {result.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <div className="text-center text-gray-500 py-8">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Panel */}
      {showPrompt && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <div><strong>Current Context:</strong> Support Dashboard</div>
              <div><strong>User Role:</strong> Support Staff</div>
              <div><strong>API Endpoints:</strong></div>
              <ul className="ml-4 space-y-1">
                <li>• POST /api/ai/retrieve - Document search</li>
                <li>• POST /api/ai/answer - AI responses</li>
                <li>• POST /api/ai/feedback - User feedback</li>
                <li>• POST /api/ai/escalate - Human escalation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}