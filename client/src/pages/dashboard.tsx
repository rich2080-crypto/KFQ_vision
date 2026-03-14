import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Bar,
} from "recharts";
import { Camera, AlertTriangle, CheckCircle, Database, RefreshCw, Activity, ArrowUpRight } from "lucide-react";

// Types
type Stats = {
  total: number;
  ng: number;
  ok: number;
  distribution: { type: string; count: number }[];
  trend: { time: string; result: string }[];
};

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/vision/stats"],
    queryFn: async () => {
      const res = await fetch("/api/vision/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vision/stats"] });
      // 다른 페이지의 쿼리도 무효화하여 데이터 갱신 유도
      queryClient.invalidateQueries({ queryKey: ["/api/vision/logs"] });
    },
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF4560"];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">통합 대시보드</h1>
          <p className="text-slate-500 mt-1">전체 생산 라인 모니터링 및 품질 현황</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="shadow-sm">
            <Database className="mr-2 h-4 w-4" />
            데이터 리셋 (샘플생성)
          </Button>
          <Button onClick={() => queryClient.invalidateQueries()} className="shadow-sm bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">총 검사 수량</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total?.toLocaleString() ?? 0} <span className="text-sm font-normal text-slate-500">EA</span></div>
            <div className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 전일 대비 +12%
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">양품 수량 (OK)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats?.ok?.toLocaleString() ?? 0} <span className="text-sm font-normal text-slate-500">EA</span></div>
            <p className="text-xs text-slate-500 mt-1">
              수율: <span className="font-bold text-green-600">{stats && stats.total > 0 ? ((stats.ok / stats.total) * 100).toFixed(1) : 0}%</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">불량 수량 (NG)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.ng?.toLocaleString() ?? 0} <span className="text-sm font-normal text-slate-500">EA</span></div>
            <p className="text-xs text-slate-500 mt-1">
              불량률: <span className="font-bold text-red-600">{stats && stats.total > 0 ? ((stats.ng / stats.total) * 100).toFixed(1) : 0}%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">주요 결함</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats?.distribution?.[0]?.type ?? "None"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              발생 빈도: {stats?.distribution?.[0]?.count ?? 0}회
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>불량 유형 분석 (Pareto Chart)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats?.distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>실시간 불량 발생 추이</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.distribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="발생 건수" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
