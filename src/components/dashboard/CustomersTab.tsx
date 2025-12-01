import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

interface Transaction {
  id: string;
  customer_id: string;
  notes: string | null;
  amount: number;
  event_date: string;
  created_date: string;
}

const customerSchema = z.object({
  pageNo: z.string().min(1, "Page number is required"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  villageName: z.string().min(1, "Village is required").max(100),
  notes: z.string().max(500).optional(),
});

const transactionSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  eventDate: z.string().min(1, "Event date is required"),
  notes: z.string().max(500).optional(),
});

const CustomersTab = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
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

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      eventDate: "",
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

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
      return;
    }

    setTransactions(data || []);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Customer deleted successfully",
    });

    setDeleteCustomerDialogOpen(false);
    setCustomerToDelete(null);
    fetchCustomers();
  };

  const onTransactionSubmit = async (values: z.infer<typeof transactionSchema>) => {
    if (!selectedCustomer) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingTransaction) {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(values.amount),
          event_date: values.eventDate,
          notes: values.notes || null,
        })
        .eq('id', editingTransaction.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert({
          customer_id: selectedCustomer.id,
          user_id: user.id,
          amount: parseFloat(values.amount),
          event_date: values.eventDate,
          notes: values.notes || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
    }

    setTransactionDialogOpen(false);
    setEditingTransaction(null);
    transactionForm.reset();
    handleCustomerClick(selectedCustomer);
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTransactionId || !selectedCustomer) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', deleteTransactionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Transaction deleted successfully",
    });

    setDeleteTransactionId(null);
    handleCustomerClick(selectedCustomer);
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
                    <Input
                      placeholder="Filter Customer ID..."
                      value={filters.id}
                      onChange={(e) => setFilters({ ...filters, id: e.target.value })}
                      className="h-8"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Filter First Name..."
                      value={filters.firstName}
                      onChange={(e) => setFilters({ ...filters, firstName: e.target.value })}
                      className="h-8"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Filter Last Name..."
                      value={filters.lastName}
                      onChange={(e) => setFilters({ ...filters, lastName: e.target.value })}
                      className="h-8"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Filter Village..."
                      value={filters.villageName}
                      onChange={(e) => setFilters({ ...filters, villageName: e.target.value })}
                      className="h-8"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Filter Page No..."
                      value={filters.pageNo}
                      onChange={(e) => setFilters({ ...filters, pageNo: e.target.value })}
                      className="h-8"
                    />
                  </TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50 font-medium"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.id}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.firstName}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.lastName}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.villageName}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.pageNo}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <span className={customer.pendingAmount >= 0 ? "text-success" : "text-destructive"}>
                        {customer.pendingAmount >= 0 ? "+" : "-"}
                        {formatCurrency(customer.pendingAmount)}
                      </span>
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50 max-w-xs truncate"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      {customer.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setTransactionDialogOpen(true);
                          }}
                        >
                          Add Transaction
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(customer);
                            setDeleteCustomerDialogOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCustomer && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Village</p>
                  <p className="font-medium">{selectedCustomer.villageName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Page No</p>
                  <p className="font-medium">{selectedCustomer.pageNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="font-medium">{formatCurrency(selectedCustomer.pendingAmount)}</p>
                </div>
              </div>
            )}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{transaction.notes || "No notes"}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Created: {formatDateTime(transaction.created_date)}</span>
                        <span>Event: {formatDateTime(transaction.event_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.amount > 0 ? "default" : "destructive"}>
                        {transaction.amount > 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingTransaction(transaction);
                          transactionForm.setValue('amount', transaction.amount.toString());
                          transactionForm.setValue('eventDate', transaction.event_date.split('T')[0]);
                          transactionForm.setValue('notes', transaction.notes || '');
                          setTransactionDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTransactionId(transaction.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transactionDialogOpen} onOpenChange={(open) => {
        setTransactionDialogOpen(open);
        if (!open) {
          setEditingTransaction(null);
          transactionForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input 
                id="amount"
                type="number" 
                step="0.01" 
                placeholder="Enter amount (negative for debit)" 
                {...transactionForm.register("amount")} 
              />
              {transactionForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{transactionForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input 
                id="eventDate"
                type="date" 
                {...transactionForm.register("eventDate")} 
              />
              {transactionForm.formState.errors.eventDate && (
                <p className="text-sm text-destructive">{transactionForm.formState.errors.eventDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes"
                placeholder="Enter notes" 
                {...transactionForm.register("notes")} 
                rows={3}
              />
              {transactionForm.formState.errors.notes && (
                <p className="text-sm text-destructive">{transactionForm.formState.errors.notes.message}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => {
                setTransactionDialogOpen(false);
                setEditingTransaction(null);
                transactionForm.reset();
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingTransaction ? 'Update' : 'Create'}</Button>
            </div>
          </form>
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

      <AlertDialog open={deleteCustomerDialogOpen} onOpenChange={setDeleteCustomerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.firstName} {customerToDelete?.lastName}? 
              This will also delete all associated transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTransactionId} onOpenChange={() => setDeleteTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomersTab;
