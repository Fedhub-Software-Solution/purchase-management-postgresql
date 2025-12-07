import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GlassCard } from "../GlassCard";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  Calculator,
} from "lucide-react";
import { fmtINR } from "./utils";

interface FinanceKPIsProps {
  kpi: {
    totalInvested?: number;
    totalExpenses?: number;
    totalTDS?: number;
    profit?: number;
  };
}

export function FinanceKPIs({ kpi }: FinanceKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <GlassCard className="group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          <Wallet className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {fmtINR(kpi.totalInvested || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline w-3 h-3 mr-1 text-green-500" />
            Capital investments & assets
          </p>
        </CardContent>
      </GlassCard>

      <GlassCard className="group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            {fmtINR(kpi.totalExpenses || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Operating costs & overheads</p>
        </CardContent>
      </GlassCard>

      <GlassCard className="group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <Calculator className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold bg-gradient-to-r ${
              (kpi.profit || 0) >= 0
                ? "from-blue-600 to-indigo-600"
                : "from-red-600 to-rose-600"
            } bg-clip-text text-transparent`}
          >
            {fmtINR(kpi.profit || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {(kpi.profit || 0) >= 0 ? (
              <>
                <TrendingUp className="inline w-3 h-3 mr-1 text-green-500" />
                Profit after expenses & TDS
              </>
            ) : (
              <>
                <TrendingDown className="inline w-3 h-3 mr-1 text-red-500" />
                Loss after expenses & TDS
              </>
            )}
          </p>
        </CardContent>
      </GlassCard>

      <GlassCard className="group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total TDS</CardTitle>
          <Receipt className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {fmtINR(kpi.totalTDS || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Tax deducted at source</p>
        </CardContent>
      </GlassCard>
    </div>
  );
}

