import { useState } from 'react';
import { format } from 'date-fns';
import { 
  DollarSign, TrendingUp, TrendingDown, Receipt, FileText, 
  Plus, Trash2, Loader2, Download, CreditCard, Wallet,
  ArrowUpRight, ArrowDownRight, PieChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  useFinancialTransactions,
  useInvoices,
  useExpenses,
  useFinancialSummary,
  useCreateExpense,
  useDeleteExpense,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useCreateTransaction,
} from '@/hooks/useFinance';

const expenseCategories = [
  { value: 'ingredients', label: 'Ingredients & Supplies' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries & Wages' },
  { value: 'rent', label: 'Rent' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'delivery', label: 'Delivery Costs' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

interface ExpenseForm {
  category: string;
  amount: string;
  description: string;
  vendor: string;
  expense_date: string;
}

interface InvoiceForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  notes: string;
  due_date: string;
}

const FinanceSection = () => {
  const { user } = useAuth();
  const { data: transactions, isLoading: transactionsLoading } = useFinancialTransactions();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const summary = useFinancialSummary();
  
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const createTransaction = useCreateTransaction();

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    category: 'ingredients',
    amount: '',
    description: '',
    vendor: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    subtotal: '',
    tax_amount: '0',
    discount_amount: '0',
    notes: '',
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'income' as 'income' | 'expense' | 'refund',
    category: 'sale',
    amount: '',
    description: '',
    payment_method: 'cash',
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount) {
      toast.error('Amount is required');
      return;
    }
    createExpense.mutate({
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description || null,
      vendor: expenseForm.vendor || null,
      expense_date: expenseForm.expense_date,
      receipt_url: null,
      created_by: user?.id || null,
    }, {
      onSuccess: () => {
        toast.success('Expense recorded');
        setExpenseDialogOpen(false);
        setExpenseForm({
          category: 'ingredients',
          amount: '',
          description: '',
          vendor: '',
          expense_date: format(new Date(), 'yyyy-MM-dd'),
        });
      },
    });
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.subtotal) {
      toast.error('Subtotal is required');
      return;
    }
    const subtotal = parseFloat(invoiceForm.subtotal);
    const tax = parseFloat(invoiceForm.tax_amount) || 0;
    const discount = parseFloat(invoiceForm.discount_amount) || 0;
    const total = subtotal + tax - discount;

    createInvoice.mutate({
      order_id: null,
      customer_name: invoiceForm.customer_name || null,
      customer_email: invoiceForm.customer_email || null,
      customer_phone: invoiceForm.customer_phone || null,
      subtotal,
      tax_amount: tax,
      discount_amount: discount,
      total_amount: total,
      status: 'pending',
      due_date: invoiceForm.due_date || null,
      paid_at: null,
      notes: invoiceForm.notes || null,
    }, {
      onSuccess: () => {
        toast.success('Invoice created');
        setInvoiceDialogOpen(false);
        setInvoiceForm({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          subtotal: '',
          tax_amount: '0',
          discount_amount: '0',
          notes: '',
          due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        });
      },
    });
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.amount) {
      toast.error('Amount is required');
      return;
    }
    createTransaction.mutate({
      order_id: null,
      type: transactionForm.type,
      category: transactionForm.category,
      amount: parseFloat(transactionForm.amount),
      description: transactionForm.description || null,
      payment_method: transactionForm.payment_method || null,
      reference_number: null,
      created_by: user?.id || null,
    }, {
      onSuccess: () => {
        toast.success('Transaction recorded');
        setTransactionDialogOpen(false);
        setTransactionForm({
          type: 'income',
          category: 'sale',
          amount: '',
          description: '',
          payment_method: 'cash',
        });
      },
    });
  };

  const handleUpdateInvoiceStatus = (id: string, status: 'pending' | 'paid' | 'cancelled' | 'refunded') => {
    updateInvoice.mutate({
      id,
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    }, {
      onSuccess: () => toast.success('Invoice updated'),
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      paid: 'bg-green-500',
      cancelled: 'bg-red-500',
      refunded: 'bg-purple-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">{summary.deliveredOrders} delivered orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">{expenses?.length || 0} expense records</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Net Profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.netProfit >= 0 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
              {' '}{((summary.netProfit / (summary.totalRevenue || 1)) * 100).toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.pendingInvoices}</p>
            <p className="text-xs text-muted-foreground">pending / {summary.paidInvoices} paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Finance Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Financial Transactions</h3>
            <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />Record Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTransactionSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={transactionForm.type} onValueChange={(v: 'income' | 'expense' | 'refund') => setTransactionForm({ ...transactionForm, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (KSh)</Label>
                      <Input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={transactionForm.category} onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={transactionForm.payment_method} onValueChange={(v) => setTransactionForm({ ...transactionForm, payment_method: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={transactionForm.description} onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                    {createTransaction.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Record Transaction
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {transactionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>M-Pesa Code</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{format(new Date(txn.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={txn.type === 'income' ? 'bg-green-500' : txn.type === 'expense' ? 'bg-red-500' : 'bg-purple-500'}>
                          {txn.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{txn.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{txn.description || '-'}</TableCell>
                      <TableCell className="capitalize">{txn.payment_method || '-'}</TableCell>
                      <TableCell>
                        {txn.reference_number ? (
                          <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {txn.reference_number}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Invoices</h3>
            <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input value={invoiceForm.customer_name} onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={invoiceForm.customer_email} onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={invoiceForm.customer_phone} onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Subtotal *</Label>
                      <Input type="number" value={invoiceForm.subtotal} onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax</Label>
                      <Input type="number" value={invoiceForm.tax_amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_amount: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount</Label>
                      <Input type="number" value={invoiceForm.discount_amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_amount: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
                    {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Invoice
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {invoicesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.customer_name || '-'}</TableCell>
                      <TableCell>{format(new Date(inv.created_at), 'MMM dd')}</TableCell>
                      <TableCell>{inv.due_date ? format(new Date(inv.due_date), 'MMM dd') : '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(inv.status)}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inv.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateInvoiceStatus(inv.id, 'paid')}>
                              Mark Paid
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteInvoice.mutate(inv.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!invoices || invoices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No invoices yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expenses</h3>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (KSh) *</Label>
                      <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Input value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                    {createExpense.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Record Expense
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {expensesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses?.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{format(new Date(exp.expense_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{exp.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{exp.description || '-'}</TableCell>
                      <TableCell>{exp.vendor || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        -{formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExpense.mutate(exp.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!expenses || expenses.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No expenses recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <h3 className="text-lg font-semibold">Financial Reports</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Balance Sheet Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold text-green-600">{formatCurrency(summary.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(summary.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-primary">
                  <span className="font-medium">Net Profit/Loss</span>
                  <span className={`font-bold text-lg ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className="font-medium">
                    {((summary.netProfit / (summary.totalRevenue || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-semibold">{summary.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Delivered Orders</span>
                  <span className="font-semibold text-green-600">{summary.deliveredOrders}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Average Order Value</span>
                  <span className="font-semibold">
                    {formatCurrency(summary.deliveredOrders > 0 ? summary.totalRevenue / summary.deliveredOrders : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">
                    {summary.totalOrders > 0 ? ((summary.deliveredOrders / summary.totalOrders) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {expenseCategories.map((cat) => {
                    const categoryExpenses = expenses?.filter(e => e.category === cat.value) || [];
                    const total = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                    const percentage = summary.totalExpenses > 0 ? (total / summary.totalExpenses) * 100 : 0;
                    
                    return (
                      <div key={cat.value} className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">{cat.label}</p>
                        <p className="text-lg font-semibold">{formatCurrency(total)}</p>
                        <div className="w-full h-2 bg-muted rounded-full mt-2">
                          <div 
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceSection;
