import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, UserCheck, CreditCard, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch all customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Fetch all transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*');

      if (transactionsError) throw transactionsError;

      // Calculate metrics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Last week and month amounts
      const lastWeekAmount = transactions
        ?.filter(t => new Date(t.created_date) >= oneWeekAgo)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const lastMonthAmount = transactions
        ?.filter(t => new Date(t.created_date) >= oneMonthAgo)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Total customers
      const totalCustomers = customers?.length || 0;

      // Active customers (customers with transactions in the last 30 days)
      const activeCustomerIds = new Set(
        transactions
          ?.filter(t => new Date(t.created_date) >= oneMonthAgo)
          .map(t => t.customer_id)
      );
      const activeCustomers = activeCustomerIds.size;

      // Credit and debit amounts
      const creditAmount = transactions
        ?.filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const debitAmount = transactions
        ?.filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

      setMetrics({
        lastWeekAmount,
        lastMonthAmount,
        totalCustomers,
        activeCustomers,
        creditAmount,
        debitAmount,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
