import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  villageName: string;
  pendingAmount: number;
  createdDate: string;
  pageNo: number;
  notes?: string;
}

const customerSchema = z.object({
  pageNo: z.string().min(1, "Page number is required"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  villageName: z.string().min(1, "Village is required").max(100),
  notes: z.string().max(500).optional(),
});

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    id: "",
    firstName: "",
    lastName: "",
    villageName: "",
    pageNo: "",
  });
  const itemsPerPage = 10;
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      pageNo: "",
      firstName: "",
      lastName: "",
      villageName: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_date", { ascending: false });

      if (error) throw error;

      const formattedCustomers: Customer[] = (data || []).map((customer) => ({
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        villageName: customer.village_name,
        pendingAmount: customer.pending_amount,
        createdDate: customer.created_date,
        pageNo: customer.page_no,
        notes: customer.notes || undefined,
      }));

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("customers").insert({
        user_id: user.id,
        page_no: parseInt(values.pageNo),
        first_name: values.firstName,
        last_name: values.lastName,
        village_name: values.villageName,
        notes: values.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      form.reset();
      setCreateDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    }
  };

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer Management</CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Customer
          </Button>
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
                  <TableHead>Notes</TableHead>
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
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {customer.notes || "-"}
                    </TableCell>
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageNo">Page Number</Label>
              <Input
                id="pageNo"
                type="number"
                {...form.register("pageNo")}
                placeholder="Enter page number"
              />
              {form.formState.errors.pageNo && (
                <p className="text-sm text-destructive">{form.formState.errors.pageNo.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter first name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="villageName">Village</Label>
              <Input
                id="villageName"
                {...form.register("villageName")}
                placeholder="Enter village name"
              />
              {form.formState.errors.villageName && (
                <p className="text-sm text-destructive">{form.formState.errors.villageName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Enter any additional notes"
                rows={3}
              />
              {form.formState.errors.notes && (
                <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Customer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomersTab;
