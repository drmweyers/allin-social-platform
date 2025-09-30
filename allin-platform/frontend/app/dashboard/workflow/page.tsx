'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  Users,
  FileText,
  ChevronRight,
  Send,
  RefreshCw
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  requiredRole: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface PendingApproval {
  postId: string;
  postContent: any;
  workflowId: string;
  step: string;
  requiredRole: string;
  currentApprovals: number;
  requiredApprovals: number;
}

interface WorkflowActivity {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  comment?: string;
  timestamp: Date;
}

export default function WorkflowPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [workflowActivities, setWorkflowActivities] = useState<WorkflowActivity[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/workflow/pending/approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch approvals');

      const data = await response.json();
      setPendingApprovals(data.approvals || []);
      if (data.approvals?.length > 0) {
        setSelectedApproval(data.approvals[0]);
        fetchWorkflowActivities(data.approvals[0].workflowId);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending approvals',
        variant: 'destructive'
      });
    }
  };

  const fetchWorkflowActivities = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflow/${workflowId}/activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();
      setWorkflowActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleApprovalAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    if (!selectedApproval) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/workflow/${selectedApproval.postId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          action,
          comment: comment || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to process approval');

      toast({
        title: 'Success',
        description: `Successfully ${action.toLowerCase()}ed the content`
      });

      setComment('');
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to process approval action',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'APPROVE':
        return 'bg-green-100 text-green-800';
      case 'REJECT':
        return 'bg-red-100 text-red-800';
      case 'REQUEST_CHANGES':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMMENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workflow Management</h1>
        <p className="text-gray-600 mt-2">Review and approve content in your workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                {pendingApprovals.length} items awaiting your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {pendingApprovals.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No pending approvals
                    </p>
                  ) : (
                    pendingApprovals.map((approval) => (
                      <div
                        key={approval.postId}
                        onClick={() => {
                          setSelectedApproval(approval);
                          fetchWorkflowActivities(approval.workflowId);
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedApproval?.postId === approval.postId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{approval.step}</Badge>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {approval.postContent?.content || 'No content preview'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>
                            {approval.currentApprovals}/{approval.requiredApprovals} approvals
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Approval Details */}
        <div className="lg:col-span-2">
          {selectedApproval ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Review Content</CardTitle>
                  <Badge>{selectedApproval.step}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="prose max-w-none">
                          {selectedApproval.postContent?.content || 'No content available'}
                        </div>
                        {selectedApproval.postContent?.media && (
                          <div className="mt-4">
                            <img
                              src={selectedApproval.postContent.media[0]}
                              alt="Post media"
                              className="rounded-lg max-w-full"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add a comment (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprovalAction('APPROVE')}
                          disabled={loading}
                          className="flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApprovalAction('REQUEST_CHANGES')}
                          disabled={loading}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Changes
                        </Button>
                        <Button
                          onClick={() => handleApprovalAction('REJECT')}
                          disabled={loading}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4">
                        {workflowActivities.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">
                            No activity yet
                          </p>
                        ) : (
                          workflowActivities.map((activity) => (
                            <div key={activity.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {activity.userName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {activity.userName || 'Unknown User'}
                                  </span>
                                  <Badge className={getActionBadgeColor(activity.action)}>
                                    {activity.action}
                                  </Badge>
                                </div>
                                {activity.comment && (
                                  <p className="text-sm text-gray-600">{activity.comment}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="details">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedApproval.currentApprovals}/{selectedApproval.requiredApprovals}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Approvals</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-purple-600">
                              {selectedApproval.requiredRole}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Required Role</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select an item to review</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}