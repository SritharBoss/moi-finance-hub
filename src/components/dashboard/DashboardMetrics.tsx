import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, UserCheck, CreditCard, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsData {
  lastWeekAmount: number;
  lastMonthAmount: number;
  totalCustomers: number;
  activeCustomers: number;
  creditAmount: number;
  debitAmount: number;
}

const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // Simulating API call with mock data
    const fetchMetrics = async () => {
      try {
        // const response = await fetch('/api/dashboard-metrics');
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockData: MetricsData = {
          lastWeekAmount: 12500,
          lastMonthAmount: 45800,
          totalCustomers: 156,
          activeCustomers: 89,
          creditAmount: 23400,
          debitAmount: 15600,
        };
        
        setMetrics(mockData);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const metricCards = [
    {
      title: "Last Week Amount",
      value: metrics?.lastWeekAmount ?? 0,
      icon: TrendingUp,
      color: "text-chart-1",
    },
    {
      title: "Last Month Amount",
      value: metrics?.lastMonthAmount ?? 0,
      icon: TrendingUp,
      color: "text-chart-1",
    },
    {
      title: "Total Customers",
      value: metrics?.totalCustomers ?? 0,
      icon: Users,
      color: "text-chart-2",
      isCurrency: false,
    },
    {
      title: "Active Customers",
      value: metrics?.activeCustomers ?? 0,
      icon: UserCheck,
      color: "text-chart-2",
      isCurrency: false,
    },
    {
      title: "Credit Amount",
      value: metrics?.creditAmount ?? 0,
      icon: CreditCard,
      color: "text-success",
    },
    {
      title: "Debit Amount",
      value: metrics?.debitAmount ?? 0,
      icon: Wallet,
      color: "text-destructive",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Your business metrics at a glance</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {card.isCurrency === false 
                    ? card.value 
                    : formatCurrency(card.value)
                  }
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardMetrics;
