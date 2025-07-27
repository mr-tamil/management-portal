// Mock data for the backend server
export const mockProfiles = [
  {
    id: 'user-1',
    full_name: 'Alice Johnson',
    email: 'alice.j@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-21T14:15:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-05-21T14:15:00Z'
  },
  {
    id: 'user-2',
    full_name: 'Bob Williams',
    email: 'bob.w@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-21T11:45:00Z',
    created_at: '2024-02-10T09:30:00Z',
    updated_at: '2024-05-21T11:45:00Z'
  },
  {
    id: 'user-3',
    full_name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-20T20:00:00Z',
    created_at: '2024-03-05T14:20:00Z',
    updated_at: '2024-05-20T20:00:00Z'
  },
  {
    id: 'user-4',
    full_name: 'Diana Prince',
    email: 'diana.p@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-18T09:30:00Z',
    created_at: '2024-01-20T11:15:00Z',
    updated_at: '2024-05-18T09:30:00Z'
  },
  {
    id: 'user-5',
    full_name: 'Ethan Hunt',
    email: 'ethan.h@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-21T10:05:00Z',
    created_at: '2024-04-01T16:45:00Z',
    updated_at: '2024-05-21T10:05:00Z'
  }
];

export const mockServices = [
  {
    id: 'service-1',
    name: 'RMS Analysis',
    description: 'Service for analyzing retail management systems data.',
    status: 'active',
    config: { version: '1.0', environment: 'production' },
    metrics: {},
    created_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-05-15T14:30:00Z'
  },
  {
    id: 'service-2',
    name: 'E-commerce Platform',
    description: 'Our primary online marketplace backend.',
    status: 'active',
    config: { version: '2.1', environment: 'production' },
    metrics: {},
    created_by: 'user-4',
    created_at: '2024-02-01T12:00:00Z',
    updated_at: '2024-05-20T16:45:00Z'
  },
  {
    id: 'service-3',
    name: 'Mobile Game Backend',
    description: 'Backend services for the new mobile game.',
    status: 'active',
    config: { version: '1.5', environment: 'production' },
    metrics: {},
    created_by: 'user-1',
    created_at: '2024-03-01T09:15:00Z',
    updated_at: '2024-05-18T11:20:00Z'
  }
];

export const mockUserServiceRoles = [
  // RMS Analysis
  { id: 'role-1', user_id: 'user-1', service_id: 'service-1', role: 'admin', granted_at: '2024-01-15T10:00:00Z', granted_by: 'user-1' },
  { id: 'role-2', user_id: 'user-4', service_id: 'service-1', role: 'admin', granted_at: '2024-01-16T10:00:00Z', granted_by: 'user-1' },
  { id: 'role-3', user_id: 'user-2', service_id: 'service-1', role: 'user', granted_at: '2024-01-17T10:00:00Z', granted_by: 'user-1' },
  { id: 'role-4', user_id: 'user-3', service_id: 'service-1', role: 'user', granted_at: '2024-01-18T10:00:00Z', granted_by: 'user-1' },
  
  // E-commerce Platform
  { id: 'role-5', user_id: 'user-4', service_id: 'service-2', role: 'admin', granted_at: '2024-02-01T12:00:00Z', granted_by: 'user-4' },
  { id: 'role-6', user_id: 'user-3', service_id: 'service-2', role: 'user', granted_at: '2024-02-02T12:00:00Z', granted_by: 'user-4' },
  { id: 'role-7', user_id: 'user-5', service_id: 'service-2', role: 'user', granted_at: '2024-02-03T12:00:00Z', granted_by: 'user-4' },
  { id: 'role-8', user_id: 'user-2', service_id: 'service-2', role: 'user', granted_at: '2024-02-04T12:00:00Z', granted_by: 'user-4' },
  
  // Mobile Game Backend
  { id: 'role-9', user_id: 'user-1', service_id: 'service-3', role: 'admin', granted_at: '2024-03-01T09:15:00Z', granted_by: 'user-1' },
  { id: 'role-10', user_id: 'user-4', service_id: 'service-3', role: 'admin', granted_at: '2024-03-02T09:15:00Z', granted_by: 'user-1' },
  { id: 'role-11', user_id: 'user-5', service_id: 'service-3', role: 'user', granted_at: '2024-03-03T09:15:00Z', granted_by: 'user-1' }
];

export const mockActivityLogs = [
  {
    id: 'activity-1',
    user_id: 'user-1',
    service_id: 'service-1',
    activity_type: 'service_access',
    description: 'Accessed RMS Analysis service',
    metadata: {},
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T14:15:00Z'
  },
  {
    id: 'activity-2',
    user_id: 'user-2',
    service_id: 'service-2',
    activity_type: 'admin_action',
    description: 'Updated service configuration',
    metadata: { action: 'config_update' },
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T13:30:00Z'
  },
  {
    id: 'activity-3',
    user_id: 'user-3',
    service_id: null,
    activity_type: 'profile_update',
    description: 'Updated profile information',
    metadata: { field: 'full_name' },
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T12:45:00Z'
  },
  {
    id: 'activity-4',
    user_id: 'user-4',
    service_id: 'service-3',
    activity_type: 'login',
    description: 'User signed in',
    metadata: {},
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T11:20:00Z'
  },
  {
    id: 'activity-5',
    user_id: 'user-5',
    service_id: 'service-2',
    activity_type: 'service_access',
    description: 'Accessed E-commerce Platform',
    metadata: {},
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T10:05:00Z'
  }
];

export const mockServiceMetrics = [
  {
    id: 'metric-1',
    service_id: 'service-1',
    metric_name: 'uptime',
    metric_value: 99.9,
    metric_unit: 'percentage',
    metadata: {},
    recorded_at: '2024-05-21T00:00:00Z'
  },
  {
    id: 'metric-2',
    service_id: 'service-1',
    metric_name: 'response_time',
    metric_value: 120,
    metric_unit: 'milliseconds',
    metadata: {},
    recorded_at: '2024-05-21T00:00:00Z'
  },
  {
    id: 'metric-3',
    service_id: 'service-1',
    metric_name: 'error_rate',
    metric_value: 0.5,
    metric_unit: 'percentage',
    metadata: {},
    recorded_at: '2024-05-21T00:00:00Z'
  }
];

// Helper functions to simulate database operations
export const mockOperations = {
  // Users
  getUsers: () => {
    return mockProfiles.map(profile => {
      const userRoles = mockUserServiceRoles.filter(role => role.user_id === profile.id);
      return {
        ...profile,
        user_service_roles: userRoles.map(role => ({
          ...role,
          services: mockServices.find(s => s.id === role.service_id)
        })),
        roles: userRoles.map(role => role.role)
      };
    });
  },

  getUser: (id) => {
    const profile = mockProfiles.find(p => p.id === id);
    if (!profile) return null;

    const userRoles = mockUserServiceRoles.filter(role => role.user_id === id);
    return {
      ...profile,
      user_service_roles: userRoles.map(role => ({
        ...role,
        services: mockServices.find(s => s.id === role.service_id)
      })),
      roles: userRoles.map(role => role.role)
    };
  },

  createUser: (userData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      full_name: userData.full_name,
      email: userData.email,
      avatar_url: null,
      is_active: true,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockProfiles.push(newUser);

    // Add activity log
    mockActivityLogs.unshift({
      id: `activity-${Date.now()}`,
      user_id: 'current-user', // This would be the actual current user ID
      service_id: null,
      activity_type: 'admin_action',
      description: `Created new user: ${userData.full_name}`,
      metadata: { action: 'create_user', target_user_id: newUser.id },
      ip_address: null,
      user_agent: 'Dashboard',
      created_at: new Date().toISOString()
    });

    return {
      ...newUser,
      user_service_roles: [],
      roles: []
    };
  },

  updateUser: (id, updates) => {
    const userIndex = mockProfiles.findIndex(p => p.id === id);
    if (userIndex === -1) return null;

    mockProfiles[userIndex] = {
      ...mockProfiles[userIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return mockOperations.getUser(id);
  },

  deactivateUser: (id) => {
    return mockOperations.updateUser(id, { is_active: false });
  },

  // Services
  getServices: () => {
    return mockServices.map(service => {
      const serviceRoles = mockUserServiceRoles.filter(role => role.service_id === service.id);
      const admins = serviceRoles
        .filter(role => role.role === 'admin')
        .map(role => mockProfiles.find(p => p.id === role.user_id))
        .filter(Boolean);
      
      const users = serviceRoles
        .filter(role => role.role === 'user')
        .map(role => mockProfiles.find(p => p.id === role.user_id))
        .filter(Boolean);

      return {
        ...service,
        adminCount: admins.length,
        userCount: users.length,
        totalUsers: serviceRoles.length,
        admins,
        users,
        user_service_roles: serviceRoles
      };
    });
  },

  getService: (id) => {
    const service = mockServices.find(s => s.id === id);
    if (!service) return null;

    const serviceRoles = mockUserServiceRoles.filter(role => role.service_id === id);
    const admins = serviceRoles
      .filter(role => role.role === 'admin')
      .map(role => mockProfiles.find(p => p.id === role.user_id))
      .filter(Boolean);
    
    const users = serviceRoles
      .filter(role => role.role === 'user')
      .map(role => mockProfiles.find(p => p.id === role.user_id))
      .filter(Boolean);

    return {
      ...service,
      adminCount: admins.length,
      userCount: users.length,
      totalUsers: serviceRoles.length,
      admins,
      users,
      user_service_roles: serviceRoles
    };
  },

  // Analytics
  getAnalytics: () => {
    return {
      userGrowth: [
        { month: 'Jan', users: 65 },
        { month: 'Feb', users: 78 },
        { month: 'Mar', users: 92 },
        { month: 'Apr', users: 108 },
        { month: 'May', users: 125 },
        { month: 'Jun', users: 142 }
      ],
      serviceUsage: [
        { service: 'RMS Analysis', usage: 85 },
        { service: 'E-commerce Platform', usage: 92 },
        { service: 'Mobile Game Backend', usage: 78 }
      ],
      systemMetrics: [
        { name: 'Uptime', value: 99.9, color: '#10b981' },
        { name: 'Response Time', value: 85, color: '#3b82f6' },
        { name: 'Error Rate', value: 0.5, color: '#ef4444' }
      ],
      recentActivity: mockActivityLogs.slice(0, 5).map(activity => ({
        ...activity,
        profiles: mockProfiles.find(p => p.id === activity.user_id),
        services: activity.service_id ? mockServices.find(s => s.id === activity.service_id) : null
      }))
    };
  }
};