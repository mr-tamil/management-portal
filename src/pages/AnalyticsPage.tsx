import { motion } from 'framer-motion'
import { TrendingUp, Users, Server, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useRealAnalytics } from '@/hooks/useRealAnalytics'

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--chart-1))",
  },
  usage: {
    label: "Usage %",
    color: "hsl(var(--chart-2))",
  },
}

export default function AnalyticsPage() {
  const { analytics, loading, error } = useRealAnalytics()

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error loading analytics</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const keyMetrics = [
    { 
      title: 'Active Users', 
      value: loading ? '...' : analytics.totalUsers.toString(), 
      change: '+12%', 
      icon: Users, 
      color: 'text-blue-600' 
    },
    { 
      title: 'Service Uptime', 
      value: loading ? '...' : `${analytics.systemMetrics.find(m => m.name === 'Uptime')?.value || 99.9}%`, 
      change: '+0.1%', 
      icon: Server, 
      color: 'text-green-600' 
    },
    { 
      title: 'Avg Response Time', 
      value: loading ? '...' : `${Math.round(analytics.avgResponseTime)}ms`, 
      change: '-5%', 
      icon: Activity, 
      color: 'text-purple-600' 
    },
    { 
      title: 'Growth Rate', 
      value: loading ? '...' : `${analytics.totalActivity}`, 
      change: '+3%', 
      icon: TrendingUp, 
      color: 'text-orange-600' 
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your service performance and user engagement.
        </p>
      </div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="glass-card glass-card-dark hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {metric.change}
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card glass-card-dark">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Monthly active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="var(--color-users)"
                        strokeWidth={3}
                        dot={{ fill: "var(--color-users)", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "var(--color-users)", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Usage Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card glass-card-dark">
            <CardHeader>
              <CardTitle>Service Usage</CardTitle>
              <CardDescription>Usage percentage by service</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.serviceUsage}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="service" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="usage"
                        fill="var(--color-usage)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Real-time performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <div className="animate-pulse w-24 h-24 bg-muted rounded-full mx-auto mb-4"></div>
                    <div className="animate-pulse h-4 bg-muted rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {analytics.systemMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="text-center"
                  >
                    <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={metric.color}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - metric.value / 100)}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="absolute text-xl font-bold" style={{ color: metric.color }}>
                        {metric.value.toFixed(1)}%
                      </span>
                    </div>
                    <h3 className="font-semibold">{metric.name}</h3>
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