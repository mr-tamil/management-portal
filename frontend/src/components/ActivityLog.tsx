'use client';

import React, { useState } from 'react';
import { useActivityLogsWithSearch } from '@/hooks/useUsers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/utils';
import { ChevronLeft, ChevronRight, FileText, Activity, AlertCircle, RefreshCw, Clock, User, Target, Search, Filter } from 'lucide-react';
import { EnhancedPagination } from './EnhancedPagination'
import { debounce } from '@/utils/performance'
import { usePrefetchNextPage } from '@/hooks/useOptimizedQueries'
import type { AuditLog } from '@/types/database';

const ACTION_DISPLAY_NAMES: Record<string, string> = {
  'user.create': 'User Created',
  'user.delete': 'User Deleted',
  'user.update': 'User Updated',
  'user.ban': 'User Banned',
  'user.unban': 'User Unbanned',
  'user.reset_password': 'Password Reset',
  'service.add_user': 'Service Access Added',
  'service.remove_user': 'Service Access Removed',
  'service.update_role': 'Service Role Updated',
};

const ACTION_COLORS: Record<string, string> = {
  'user.create': 'bg-green-100 text-green-800 border-green-200',
  'user.delete': 'bg-red-100 text-red-800 border-red-200',
  'user.update': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'user.ban': 'bg-orange-100 text-orange-800 border-orange-200',
  'user.unban': 'bg-blue-100 text-blue-800 border-blue-200',
  'user.reset_password': 'bg-purple-100 text-purple-800 border-purple-200',
  'service.add_user': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'service.remove_user': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'service.update_role': 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const getActionDisplayName = (action: string) => ACTION_DISPLAY_NAMES[action] || action;
const getActionColor = (action: string) => ACTION_COLORS[action] || 'bg-gray-100 text-gray-800 border-gray-200';

export function ActivityLog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  React.useEffect(() => {
    const debouncedUpdate = debounce(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    
    debouncedUpdate()
  }, [search])

  const { data: logsResponse, isLoading, error, refetch, isFetching } = useActivityLogsWithSearch(
    currentPage, 
    25, 
    debouncedSearch, 
    actionFilter
  );

  const logs: AuditLog[] = logsResponse?.data?.logs || [];
  const totalPages = logsResponse?.data?.totalPages || 1;
  const total = logsResponse?.data?.total || 0;

  // Prefetch next page for better UX
  usePrefetchNextPage(currentPage, totalPages, {
    search: debouncedSearch,
    action: actionFilter,
  })

  const clearFilters = () => {
    setSearch('')
    setActionFilter('')
    setCurrentPage(1)
  }

  const hasActiveFilters = search || actionFilter

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'user.create', label: 'User Created' },
    { value: 'user.delete', label: 'User Deleted' },
    { value: 'user.update', label: 'User Updated' },
    { value: 'user.ban', label: 'User Banned' },
    { value: 'user.unban', label: 'User Unbanned' },
    { value: 'user.reset_password', label: 'Password Reset' },
    { value: 'service.add_user', label: 'Service Access Added' },
    { value: 'service.remove_user', label: 'Service Access Removed' },
    { value: 'service.update_role', label: 'Service Role Updated' },
  ]

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive mb-2">Failed to Load Activity Logs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There was an error loading the activity data. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filters */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-muted">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user email, action, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base bg-background"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[search, actionFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Action Type</label>
                    <Select onValueChange={(value) => {
                      setActionFilter(value === 'all' ? '' : value)
                      setCurrentPage(1)
                    }} value={actionFilter || 'all'}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span>Showing {logs.length} of {total} activities</span>
          {hasActiveFilters && (
            <Badge variant="outline" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>
        <div className="text-xs">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Activity Log Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Performed By</TableHead>
                  <TableHead className="font-semibold">Target</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                  <TableHead className="font-semibold">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse w-24"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-28"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">No Activity Found</h3>
                          <p className="text-sm text-muted-foreground">
                            System activities will appear here as they occur
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Badge className={`text-xs ${getActionColor(log.action)}`}>
                          {getActionDisplayName(log.action)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{log.actor_email}</div>
                            {log.actor_id && (
                              <div className="text-xs text-muted-foreground">
                                {log.actor_id.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {log.target_email ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                              <Target className="h-3 w-3 text-accent" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{log.target_email}</div>
                              {log.target_id && (
                                <div className="text-xs text-muted-foreground">
                                  {log.target_id.slice(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">System</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {log.details ? (
                          <div className="space-y-1">
                            {log.details.full_name && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Name:</span>{' '}
                                <span className="font-medium">{log.details.full_name}</span>
                              </div>
                            )}
                            {log.details.service && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Service:</span>{' '}
                                <span className="font-medium">{log.details.service}</span>
                              </div>
                            )}
                            {log.details.role && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Role:</span>{' '}
                                <Badge variant="outline" className="text-xs h-4 px-1">
                                  {log.details.role}
                                </Badge>
                              </div>
                            )}
                            {log.details.duration && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Duration:</span>{' '}
                                <span className="font-medium">{log.details.duration}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <div>
                            <div>{formatDate(log.created_at)}</div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Pagination */}
      <EnhancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        itemsPerPage={25}
        onPageChange={setCurrentPage}
        isLoading={isLoading || isFetching}
      />
    </div>
  );
}
