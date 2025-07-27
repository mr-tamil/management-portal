import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Server, Activity, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useServices } from '@/hooks/useServices'
import { useUsers } from '@/hooks/useUsers'
import { useRealAnalytics } from '@/hooks/useRealAnalytics'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { services, loading: servicesLoading } = useServices()
  const { users, loading: usersLoading } = useUsers()
  const { analytics, loading: analyticsLoading } = useRealAnalytics()

  const stats = [
    {
      title: 'Total Users',
      value: usersLoading ? '...' : users.length.toString(),
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Services',
      value: servicesLoading ? '...' : services.filter(s => s.status === 'active').length.toString(),
      change: '+5%',
      icon: Server,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'System Health',
      value: analyticsLoading ? '...' : `${analytics.systemMetrics.find(m => m.name === 'Uptime')?.value.toFixed(1) || 99.9}%`,
      change: '+0.1%',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Performance',
      value: analyticsLoading ? '...' : `${analytics.systemMetrics.find(m => m.name === 'Response Time')?.value.toFixed(0) || 95}%`,
      change: '+3%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your services.
          </p>
        </div>
        <Button asChild>
          <Link to="/users">
            View Users
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="glass-card glass-card-dark hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Services Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Services Overview</CardTitle>
                <CardDescription>
                  Manage and monitor your active services
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/users">View All Users</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.slice(0, 6).map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover-lift cursor-pointer transition-all duration-300 hover:shadow-lg border-2 hover:border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <Badge variant="secondary">
                            {service.totalUsers} users
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                              {service.admins?.slice(0, 3).map((admin, i) => (
                                <div
                                  key={admin.id}
                                  className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                                >
                                  {admin.full_name.split(' ').map(n => n[0]).join('')}
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {service.adminCount} admin{service.adminCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/services/${service.id}`}>
                              View Details
                              <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}