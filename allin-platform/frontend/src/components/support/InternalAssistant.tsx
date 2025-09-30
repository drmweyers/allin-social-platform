'use client'

/**
 * Internal Assistant Widget
 *
 * Compact chat widget that can be embedded in any page for staff support.
 * Provides quick access to AI-powered documentation search and Q&A.
 */

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, ExternalLink, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  confidence?: number
}

interface InternalAssistantProps {
  // Allow customization for different contexts
  context?: string
  className?: string
  // Position the widget
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  // Only show for staff (admin/editor roles)
  userRole?: string
}

export default function InternalAssistant({
  context = 'general',
  className = '',
  position = 'bottom-right',
  userRole
}: InternalAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: '👋 Hi! I\'m your AI assistant. Ask me anything about AllIN Platform!',
      timestamp: new Date()
    }
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Only show for staff members
  const isStaff = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'support_staff'

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAskQuestion = async () => {
    if (!query.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
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
          userRole: userRole || 'staff',
          featureContext: context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get answer')
      }

      const data = await response.json()
      const answer = data.data

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: answer.answer,
        timestamp: new Date(),
        confidence: answer.confidence
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again or check the support dashboard.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])

      toast({
        title: 'Connection Error',
        description: 'Unable to reach AI assistant. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  // Don't render for non-staff users
  if (!isStaff) {
    return null
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {!isOpen ? (
        // Floating Action Button
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
          title="AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        // Chat Widget
        <Card className="w-80 h-96 shadow-2xl border-2">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                AI Assistant
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700 h-6 w-6 p-0"
                  onClick={() => window.open('/dashboard/support', '_blank')}
                  title="Open Full Support Dashboard"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700 h-6 w-6 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-2 text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.type === 'system'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>

                      {/* Confidence indicator for assistant messages */}
                      {message.type === 'assistant' && message.confidence !== undefined && (
                        <div className="mt-1 flex justify-end">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              message.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                              message.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {Math.round(message.confidence * 100)}%
                          </Badge>
                        </div>
                      )}

                      <div className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-2 text-sm">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a quick question..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAskQuestion()
                    }
                  }}
                  className="text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!query.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setQuery('How do I help a user who can\'t log in?')}
                >
                  Login Issues
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setQuery('How does the billing system work?')}
                >
                  Billing
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setQuery('API rate limits')}
                >
                  API Limits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}