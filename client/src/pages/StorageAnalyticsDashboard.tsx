import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, TrendingDown, TrendingUp, HardDrive, DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StorageAnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const { data: analyticsData, isLoading: analyticsLoading } = trpc.storageAnalytics.getAnalytics.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: costBreakdown } = trpc.storageAnalytics.getCostBreakdown.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: storageTrend } = trpc.storageAnalytics.getStorageTrend.useQuery(
    { userId: user?.id || 0, days: 30 },
    { enabled: !!user?.id }
  );

  const { data: recommendations } = trpc.storageAnalytics.getRecommendations.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: migrationStatus } = trpc.storageAnalytics.getMigrationStatus.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    if (!authLoading && !analyticsLoading && analyticsData) {
      setLoading(false);
    }
  }, [authLoading, analyticsLoading, analyticsData]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Storage analytics data is not available yet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Storage Analytics</h1>
          <p className="text-slate-400">Monitor your cloud storage usage, costs, and optimization opportunities</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analyticsData.totalFiles}</div>
              <p className="text-xs text-slate-400 mt-1">files stored in R2</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Total Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {formatBytes(analyticsData.totalSize)}
              </div>
              <p className="text-xs text-slate-400 mt-1">total size</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">£{analyticsData.totalCost.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-1">R2 storage cost</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">£{analyticsData.profitMargin.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-1">guaranteed minimum</p>
            </CardContent>
          </Card>
        </div>

        {/* Migration Status */}
        {migrationStatus && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">S3-to-R2 Migration Status</CardTitle>
              <CardDescription className="text-slate-400">Latest migration job results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-lg font-semibold text-green-400 capitalize">{migrationStatus.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Migrated Files</p>
                  <p className="text-lg font-semibold text-white">{migrationStatus.migratedFiles}/{migrationStatus.totalFiles}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Cost</p>
                  <p className="text-lg font-semibold text-blue-400">£{migrationStatus.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Savings</p>
                  <p className="text-lg font-semibold text-green-400">£{migrationStatus.totalSavings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Trend */}
          {storageTrend && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">30-Day Cost Trend</CardTitle>
                <CardDescription className="text-slate-400">Storage cost progression over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={storageTrend.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#3b82f6" name="Cost (£)" strokeWidth={2} />
                    <Line type="monotone" dataKey="savings" stroke="#10b981" name="Savings (£)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Storage Breakdown */}
          {analyticsData && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Storage Breakdown</CardTitle>
                <CardDescription className="text-slate-400">Distribution by file type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.storageBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category }) => category}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="size"
                    >
                      {analyticsData.storageBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cost Breakdown */}
        {costBreakdown && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Cost Breakdown by Category</CardTitle>
              <CardDescription className="text-slate-400">Detailed cost analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBreakdown.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Bar dataKey="cost" fill="#3b82f6" name="Cost (£)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Optimization Recommendations</CardTitle>
              <CardDescription className="text-slate-400">
                Potential savings: £{recommendations.totalPotentialSavings.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{rec.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          rec.priority === 'high' ? 'bg-red-900 text-red-200' :
                          rec.priority === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-blue-900 text-blue-200'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="text-sm text-green-400">Save £{rec.potentialSavings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Metrics */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cost Metrics</CardTitle>
            <CardDescription className="text-slate-400">Detailed cost analysis</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-400">Cost Per File</p>
              <p className="text-2xl font-bold text-white mt-2">£{analyticsData.costPerFile.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Cost Per GB</p>
              <p className="text-2xl font-bold text-white mt-2">£{analyticsData.costPerGB.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Average File Size</p>
              <p className="text-2xl font-bold text-white mt-2">{formatBytes(analyticsData.totalSize / analyticsData.totalFiles)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
