import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  notes: string | null;
  amount: number;
  created_date: string;
  event_date: string;
  customer_id: string;
}

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
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
    }).format(Math.abs(amount));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${
                    transaction.amount >= 0 ? "bg-success/10" : "bg-destructive/10"
                  }`}>
                    {transaction.amount >= 0 ? (
                      <ArrowDownLeft className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{transaction.notes || "No notes"}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Created: {formatDateTime(transaction.created_date)}</p>
                      <p>Event: {formatDateTime(transaction.event_date)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge
                      variant={transaction.amount >= 0 ? "default" : "destructive"}
                      className="text-base font-semibold"
                    >
                      {transaction.amount >= 0 ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
