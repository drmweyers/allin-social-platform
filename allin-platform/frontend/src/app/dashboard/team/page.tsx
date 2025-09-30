'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Activity,
  Settings,
  Key,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  lastActive: string;
  permissions: Permission[];
  department?: string;
  phone?: string;
  location?: string;
  invitedBy?: string;
  activatedAt?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'analytics' | 'settings' | 'team' | 'billing';
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: Permission[];
}

const permissions: Permission[] = [
  // Content permissions
  { id: 'create_posts', name: 'Create Posts', description: 'Create and draft social media posts', category: 'content' },
  { id: 'edit_posts', name: 'Edit Posts', description: 'Edit existing posts and drafts', category: 'content' },
  { id: 'publish_posts', name: 'Publish Posts', description: 'Publish posts to social media platforms', category: 'content' },
  { id: 'delete_posts', name: 'Delete Posts', description: 'Delete posts and drafts', category: 'content' },
  { id: 'schedule_posts', name: 'Schedule Posts', description: 'Schedule posts for future publishing', category: 'content' },
  { id: 'manage_media', name: 'Manage Media Library', description: 'Upload, organize, and delete media files', category: 'content' },

  // Analytics permissions
  { id: 'view_analytics', name: 'View Analytics', description: 'Access analytics and reporting', category: 'analytics' },
  { id: 'export_reports', name: 'Export Reports', description: 'Export analytics data and reports', category: 'analytics' },
  { id: 'manage_competitors', name: 'Manage Competitors', description: 'Add and analyze competitor data', category: 'analytics' },

  // Team permissions
  { id: 'view_team', name: 'View Team', description: 'View team member list and profiles', category: 'team' },
  { id: 'invite_members', name: 'Invite Members', description: 'Send invitations to new team members', category: 'team' },
  { id: 'edit_members', name: 'Edit Members', description: 'Edit team member roles and permissions', category: 'team' },
  { id: 'remove_members', name: 'Remove Members', description: 'Remove team members from the organization', category: 'team' },

  // Settings permissions
  { id: 'manage_accounts', name: 'Manage Social Accounts', description: 'Connect and manage social media accounts', category: 'settings' },
  { id: 'manage_integrations', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'settings' },
  { id: 'manage_billing', name: 'Manage Billing', description: 'Access billing information and manage subscriptions', category: 'billing' },
  { id: 'manage_organization', name: 'Manage Organization', description: 'Edit organization settings and preferences', category: 'settings' }
];

const roles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    color: 'bg-red-100 text-red-800',
    permissions: permissions // All permissions
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create, edit, and publish content',
    color: 'bg-blue-100 text-blue-800',
    permissions: permissions.filter(p =>
      p.category === 'content' ||
      p.id === 'view_analytics' ||
      p.id === 'view_team'
    )
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content and analytics',
    color: 'bg-green-100 text-green-800',
    permissions: permissions.filter(p =>
      p.id === 'view_analytics' ||
      p.id === 'view_team'
    )
  }
];

// API functions
const fetchTeamMembers = async () => {
  try {
    const response = await fetch('/api/team/members');
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to fetch team members');
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

const fetchTeamStats = async () => {
  try {
    const response = await fetch('/api/team/stats');
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to fetch team stats');
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return null;
  }
};

const statusIcons = {
  active: <CheckCircle className="h-4 w-4 text-green-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  suspended: <XCircle className="h-4 w-4 text-red-500" />
};

const roleIcons = {
  admin: <Crown className="h-4 w-4 text-yellow-600" />,
  editor: <Shield className="h-4 w-4 text-blue-600" />,
  viewer: <Eye className="h-4 w-4 text-green-600" />
};

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [teamStats, setTeamStats] = useState<any>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('viewer');
  const [inviteMessage, setInviteMessage] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [membersData, statsData] = await Promise.all([
          fetchTeamMembers(),
          fetchTeamStats()
        ]);
        setTeamMembers(membersData);
        setTeamStats(statsData);
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0].replace('.', ' '),
      email: inviteEmail,
      role: inviteRole as 'admin' | 'editor' | 'viewer',
      status: 'pending',
      joinedAt: new Date().toISOString(),
      lastActive: '',
      permissions: roles.find(r => r.id === inviteRole)?.permissions || [],
      invitedBy: 'current.user@allin.demo'
    };

    setTeamMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setInviteRole('viewer');
    setInviteMessage('');
    setIsInviteDialogOpen(false);
    setIsLoading(false);
  };

  const handleUpdateMemberRole = (memberId: string, newRole: string) => {
    setTeamMembers(prev => prev.map(member =>
      member.id === memberId
        ? {
            ...member,
            role: newRole as 'admin' | 'editor' | 'viewer',
            permissions: roles.find(r => r.id === newRole)?.permissions || []
          }
        : member
    ));
  };

  const handleUpdateMemberStatus = (memberId: string, newStatus: string) => {
    setTeamMembers(prev => prev.map(member =>
      member.id === memberId
        ? { ...member, status: newStatus as 'active' | 'pending' | 'suspended' }
        : member
    ));
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const getRoleInfo = (roleId: string) => {
    return roles.find(role => role.id === roleId) || roles[2]; // Default to viewer
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and permissions for your organization
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          {roleIcons[role.id as keyof typeof roleIcons]}
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-xs text-muted-foreground">{role.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Welcome Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Welcome to our team! We're excited to have you on board."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember} disabled={!inviteEmail.trim() || isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">
                  {isLoadingData ? '-' : (teamStats?.totalMembers || teamMembers.length)}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingData ? '-' : (teamStats?.activeMembers || teamMembers.filter(m => m.status === 'active').length)}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {isLoadingData ? '-' : (teamStats?.pendingInvites || teamMembers.filter(m => m.status === 'pending').length)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingData ? '-' : (teamStats?.byRole?.admin || teamMembers.filter(m => m.role === 'admin').length)}
                </p>
              </div>
              <Crown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="editor">Editors</SelectItem>
                <SelectItem value="viewer">Viewers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Members List */}
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          <Badge className={getRoleInfo(member.role).color}>
                            {getRoleInfo(member.role).name}
                          </Badge>
                          {statusIcons[member.status]}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </span>
                          {member.department && (
                            <span>{member.department}</span>
                          )}
                          {member.location && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {member.location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>Joined {formatDate(member.joinedAt)}</span>
                          <span>Last active {formatLastActive(member.lastActive)}</span>
                          {member.invitedBy && (
                            <span>Invited by {member.invitedBy}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMember(member)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          {member.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleUpdateMemberStatus(member.id, 'suspended')}>
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : member.status === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleUpdateMemberStatus(member.id, 'active')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateMemberStatus(member.id, 'active')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-6">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {roleIcons[role.id as keyof typeof roleIcons]}
                      <div>
                        <CardTitle>{role.name}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={role.color}>
                        {teamMembers.filter(m => m.role === role.id).length} members
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Permissions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(
                          role.permissions.reduce((acc, permission) => {
                            if (!acc[permission.category]) {
                              acc[permission.category] = [];
                            }
                            acc[permission.category].push(permission);
                            return acc;
                          }, {} as Record<string, Permission[]>)
                        ).map(([category, perms]) => (
                          <div key={category} className="space-y-2">
                            <h5 className="text-sm font-medium capitalize text-muted-foreground">
                              {category}
                            </h5>
                            <div className="space-y-1">
                              {perms.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2 text-sm">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>{permission.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Detail Dialog */}
      <Dialog open={selectedMember !== null} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle>Team Member Details</DialogTitle>
                <DialogDescription>
                  View and manage {selectedMember.name}'s profile and permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedMember.avatar} />
                    <AvatarFallback className="text-lg">
                      {selectedMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedMember.name}</h3>
                    <p className="text-muted-foreground">{selectedMember.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getRoleInfo(selectedMember.role).color}>
                        {getRoleInfo(selectedMember.role).name}
                      </Badge>
                      {statusIcons[selectedMember.status]}
                      <span className="text-sm text-muted-foreground capitalize">
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMember.email}</span>
                      </div>
                      {selectedMember.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedMember.phone}</span>
                        </div>
                      )}
                      {selectedMember.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedMember.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Account Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined {formatDate(selectedMember.joinedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Last active {formatLastActive(selectedMember.lastActive)}</span>
                      </div>
                      {selectedMember.activatedAt && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span>Activated {formatDate(selectedMember.activatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(
                      selectedMember.permissions.reduce((acc, permission) => {
                        if (!acc[permission.category]) {
                          acc[permission.category] = [];
                        }
                        acc[permission.category].push(permission);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <h5 className="text-sm font-medium capitalize text-muted-foreground">
                          {category}
                        </h5>
                        <div className="space-y-1">
                          {perms.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{permission.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(value) => handleUpdateMemberRole(selectedMember.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}