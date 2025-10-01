import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  RefreshCw,
} from 'lucide-react';
import { MessageFilters } from '@/types/inbox';

interface InboxFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  filters: MessageFilters;
  onFiltersChange: (filters: Partial<MessageFilters>) => void;
  stats: {
    total: number;
    unread: number;
    starred: number;
    highPriority: number;
  } | null;
  onRefresh: () => void;
  loading?: boolean;
}

const platformOptions = [
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
];

const typeOptions = [
  { value: 'message', label: 'Direct Messages' },
  { value: 'comment', label: 'Comments' },
  { value: 'mention', label: 'Mentions' },
  { value: 'review', label: 'Reviews' },
];

const priorityOptions = [
  { value: 'high', label: 'High Priority', color: 'text-red-600' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
  { value: 'low', label: 'Low Priority', color: 'text-gray-600' },
];

export const InboxFilters: React.FC<InboxFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  stats,
  onRefresh,
  loading = false,
}) => {
  const clearFilters = () => {
    onFiltersChange({
      platform: undefined,
      type: undefined,
      priority: undefined,
    });
    onSearchChange('');
  };

  const hasActiveFilters = filters.platform || filters.type || filters.priority || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages, names, or content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Platform Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Platform
                {filters.platform && <Badge variant="secondary" className="ml-2">1</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {platformOptions.map((platform) => {
                const Icon = platform.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={platform.value}
                    checked={filters.platform === platform.value}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        platform: checked ? platform.value as any : undefined,
                      })
                    }
                  >
                    <Icon className={`h-4 w-4 mr-2 ${platform.color}`} />
                    {platform.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
              {filters.platform && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onFiltersChange({ platform: undefined })}>
                    Clear platform filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Type
                {filters.type && <Badge variant="secondary" className="ml-2">1</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {typeOptions.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type.value}
                  checked={filters.type === type.value}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      type: checked ? type.value as any : undefined,
                    })
                  }
                >
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
              {filters.type && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onFiltersChange({ type: undefined })}>
                    Clear type filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Priority
                {filters.priority && <Badge variant="secondary" className="ml-2">1</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {priorityOptions.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority.value}
                  checked={filters.priority === priority.value}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      priority: checked ? priority.value as any : undefined,
                    })
                  }
                >
                  <span className={priority.color}>{priority.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
              {filters.priority && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onFiltersChange({ priority: undefined })}>
                    Clear priority filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="relative">
            All Messages
            {stats && stats.total > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {stats && stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="starred" className="relative">
            Starred
            {stats && stats.starred > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {stats.starred}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="high-priority" className="relative">
            High Priority
            {stats && stats.highPriority > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {stats.highPriority}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.platform && (
            <Badge variant="outline" className="text-xs">
              Platform: {platformOptions.find(p => p.value === filters.platform)?.label}
            </Badge>
          )}
          {filters.type && (
            <Badge variant="outline" className="text-xs">
              Type: {typeOptions.find(t => t.value === filters.type)?.label}
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="outline" className="text-xs">
              Priority: {filters.priority}
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="outline" className="text-xs">
              Search: "{searchQuery}"
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};