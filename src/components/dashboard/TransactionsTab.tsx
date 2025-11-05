import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Transaction {
  id: string;
  notes: string;
  amount: number;
  createdDate: string;
}

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchTransactions = async () => {
      try {
        // const response = await fetch('/api/transactions');
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockTransactions: Transaction[] = Array.from({ length: 30 }, (_, i) => ({
          id: `txn-${i + 1}`,
          notes: `Transaction note ${i + 1}: ${Math.random() > 0.5 ? 'Payment received' : 'Payment made'}`,
          amount: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) : -Math.floor(Math.random() * 3000),
          createdDate: new Date(2024, 10, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
        })).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        
        setTransactions(mockTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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
            {transactions.map((transaction) => (
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
                  <p className="text-sm font-medium leading-none">{transaction.notes}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(transaction.createdDate)}
                  </p>
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
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
