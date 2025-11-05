import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  villageName: string;
  pendingAmount: number;
  createdDate: string;
  pageNo: number;
}

interface Transaction {
  id: string;
  notes: string;
  amount: number;
  createdDate: string;
  customerId: string;
}

const CustomersTab = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    id: "",
    firstName: "",
    lastName: "",
    villageName: "",
    pageNo: "",
  });
  const itemsPerPage = 10;

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchCustomers = async () => {
      try {
        // const response = await fetch(`/api/customers?page=${currentPage}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockCustomers: Customer[] = Array.from({ length: 25 }, (_, i) => ({
          id: `cust-${i + 1}`,
          firstName: `First${i + 1}`,
          lastName: `Last${i + 1}`,
          villageName: `Village ${i % 5 + 1}`,
          pendingAmount: Math.random() > 0.5 ? Math.floor(Math.random() * 10000) : -Math.floor(Math.random() * 5000),
          createdDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          pageNo: Math.floor(i / 5) + 1,
        }));
        
        setCustomers(mockCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [currentPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Mock transactions for the selected customer
    const mockTransactions: Transaction[] = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
      id: `txn-${customer.id}-${i + 1}`,
      notes: `Transaction ${i + 1} for ${customer.firstName}`,
      amount: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) : -Math.floor(Math.random() * 3000),
      createdDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      customerId: customer.id,
    }));
    setCustomerTransactions(mockTransactions);
  };

  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.id.toLowerCase().includes(filters.id.toLowerCase()) &&
      customer.firstName.toLowerCase().includes(filters.firstName.toLowerCase()) &&
      customer.lastName.toLowerCase().includes(filters.lastName.toLowerCase()) &&
      customer.villageName.toLowerCase().includes(filters.villageName.toLowerCase()) &&
      (filters.pageNo === "" || customer.pageNo.toString().includes(filters.pageNo))
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="space-y-2">
                      <div>ID</div>
                      <Input
                        placeholder="Filter ID"
                        value={filters.id}
                        onChange={(e) => setFilters({ ...filters, id: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="space-y-2">
                      <div>First Name</div>
                      <Input
                        placeholder="Filter name"
                        value={filters.firstName}
                        onChange={(e) => setFilters({ ...filters, firstName: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="space-y-2">
                      <div>Last Name</div>
                      <Input
                        placeholder="Filter name"
                        value={filters.lastName}
                        onChange={(e) => setFilters({ ...filters, lastName: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="space-y-2">
                      <div>Village</div>
                      <Input
                        placeholder="Filter village"
                        value={filters.villageName}
                        onChange={(e) => setFilters({ ...filters, villageName: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Pending Amount</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>
                    <div className="space-y-2">
                      <div>Page No</div>
                      <Input
                        placeholder="Filter page"
                        value={filters.pageNo}
                        onChange={(e) => setFilters({ ...filters, pageNo: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <TableCell className="font-medium">{customer.id}</TableCell>
                    <TableCell>{customer.firstName}</TableCell>
                    <TableCell>{customer.lastName}</TableCell>
                    <TableCell>{customer.villageName}</TableCell>
                    <TableCell className="text-right">
                      <span className={customer.pendingAmount >= 0 ? "text-success" : "text-destructive"}>
                        {customer.pendingAmount >= 0 ? "+" : "-"}
                        {formatCurrency(customer.pendingAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(customer.createdDate)}
                    </TableCell>
                    <TableCell>{customer.pageNo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm px-3 py-1 bg-muted rounded">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Transaction History - {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {customerTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{transaction.notes}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(transaction.createdDate)}
                    </p>
                  </div>
                  <Badge
                    variant={transaction.amount >= 0 ? "default" : "destructive"}
                    className="ml-4"
                  >
                    {transaction.amount >= 0 ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomersTab;
