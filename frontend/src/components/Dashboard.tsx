'use client'

import React, { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { CreateUserDialog } from './CreateUserDialog'
import { UsersTable } from './UsersTable'
import { ActivityLog } from './ActivityLog'
import { Users, Database, Shield, Activity, TrendingUp, UserCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Dashboard() {
  const { data: usersResponse } = useUsers(1, 100) // Reduced for better performance

  const totalUsers = usersResponse?.data?.total || 0
  const users = usersResponse?.data?.users || []
  
  const adminUsers = users.filter(u => 
    u.service_roles.some(sr => sr.service.name === 'Adminium' && sr.role === 'admin')
  ).length
  
  const verifiedUsers = users.filter(u => u.email_confirmed_at).length
  const bannedUsers = users.filter(u => {
    if (!u.banned_until) return false
    if (u.banned_until === 'none') return true
    return new Date(u.banned_until) > new Date()
  }).length

  const recentUsers = users.filter(u => {
    const createdAt = new Date(u.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return createdAt > sevenDaysAgo
  }).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Adminium</h1>
                <p className="text-muted-foreground text-lg">User Management & System Administration</p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Comprehensive user management system with role-based access control, 
              activity monitoring, and enterprise-grade security features.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <CreateUserDialog />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalUsers}</div>
            <p className="text-xs text-blue-600 mt-1">
              {recentUsers > 0 ? `+${recentUsers} this week` : 'No new users this week'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{verifiedUsers}</div>
            <p className="text-xs text-green-600 mt-1">
              {totalUsers > 0 ? `${Math.round((verifiedUsers / totalUsers) * 100)}% verified` : '0% verified'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{adminUsers}</div>
            <p className="text-xs text-purple-600 mt-1">
              {totalUsers > 0 ? `${Math.round((adminUsers / totalUsers) * 100)}% admins` : '0% admins'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Active Services</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">2</div>
            <p className="text-xs text-orange-600 mt-1">Adminium & RMS</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Banned Users</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{bannedUsers}</div>
            <p className="text-xs text-red-600 mt-1">
              {totalUsers > 0 ? `${Math.round((bannedUsers / totalUsers) * 100)}% banned` : '0% banned'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <div className="bg-background rounded-xl border shadow-sm p-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Log</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="users" className="space-y-6">
          <div className="bg-background rounded-xl border shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">User Management</h2>
                  <p className="text-muted-foreground mt-1">
                    Create, manage, and monitor user accounts across all services
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {totalUsers} total users
                  </div>
                  <CreateUserDialog />
                </div>
              </div>
            </div>
            <div className="p-6">
              <UsersTable />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="bg-background rounded-xl border shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Activity Log</h2>
                  <p className="text-muted-foreground mt-1">
                    Monitor all system activities and user actions in real-time
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Real-time monitoring</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ActivityLog />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
