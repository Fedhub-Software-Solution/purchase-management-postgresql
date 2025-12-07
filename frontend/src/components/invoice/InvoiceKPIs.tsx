import { motion } from "motion/react";
import { Card, CardContent } from "../ui/card";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "../../utils/currency";
import type { KPIStats } from "./types";

interface InvoiceKPIsProps {
  kpis: KPIStats;
}

export function InvoiceKPIs({ kpis }: InvoiceKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Invoices
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {kpis.totalInvoices}
                </p>
                <p className="text-sm text-muted-foreground">
                  Revenue: {formatCurrency(kpis.totalRevenue, DEFAULT_CURRENCY)}
                </p>
              </div>
              <div className="p-3 bg-blue-600 rounded-full">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Paid Invoices
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {kpis.paidInvoices}
                </p>
                <p className="text-sm text-muted-foreground">
                  Revenue: {formatCurrency(kpis.paidRevenue, DEFAULT_CURRENCY)}
                </p>
              </div>
              <div className="p-3 bg-green-600 rounded-full">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Pending Invoices
                </p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {kpis.pendingInvoices}
                </p>
                <p className="text-sm text-muted-foreground">
                  Revenue: {formatCurrency(kpis.pendingRevenue, DEFAULT_CURRENCY)}
                </p>
              </div>
              <div className="p-3 bg-yellow-600 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Overdue Invoices
                </p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {kpis.overdueInvoices}
                </p>
                <p className="text-sm text-muted-foreground">
                  Revenue: {formatCurrency(kpis.overdueRevenue, DEFAULT_CURRENCY)}
                </p>
              </div>
              <div className="p-3 bg-red-600 rounded-full">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

