import { useState } from "react";
import { motion } from "motion/react";
import { Breadcrumb } from "../Breadcrumb";
import { GlassCard } from "../GlassCard";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { ArrowLeft, Edit, Check, X } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { fmtINR, getStatusColor } from "./utils";

interface FinanceReimbursedTableProps {
  records: any[];
  onBack: () => void;
  onUpdateReimbursed: (
    record: any,
    reimbursedAmount: number,
    context?: { groupReimbursed: number }
  ) => Promise<void>;
  isUpdating?: boolean;
}

export function FinanceReimbursedTable({
  records,
  onBack,
  onUpdateReimbursed,
  isUpdating = false,
}: FinanceReimbursedTableProps) {
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const rows = records
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime()
    );
  const groupedRows = Array.from(
    rows.reduce((acc, r) => {
      const rawName = String((r as any).amountSpentBy || "").trim();
      const name = rawName || "Unassigned";
      const amount = Number(r.amount || 0);
      const reimbursed = Number(r.reimbursedAmount || 0);
      const key = rawName ? rawName.toLowerCase() : `unassigned-${String((r as any).category || "other").toLowerCase()}`;
      const existing = acc.get(key);
      if (existing) {
        existing.totalAmountSpent += amount;
        existing.amountReimbursed += reimbursed;
        // keep latest record in sorted list as editable target
      } else {
        acc.set(key, {
          key,
          amountSpentBy: name,
          totalAmountSpent: amount,
          amountReimbursed: reimbursed,
          targetRecord: r,
        });
      }
      return acc;
    }, new Map<string, any>())
  ).map(([, g]) => ({
    ...g,
    pendingAmount: Number(g.totalAmountSpent - g.amountReimbursed),
    status:
      Number(g.totalAmountSpent - g.amountReimbursed) <= 0
        ? "completed"
        : "pending",
  }));

  const startEdit = (r: any) => {
    setEditingId(r.key);
    setEditingValue(String(Number(r.amountReimbursed || 0)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const saveEdit = async (r: any) => {
    const value = Number(editingValue || 0);
    await onUpdateReimbursed(
      r.targetRecord,
      Number.isFinite(value) ? value : 0,
      { groupReimbursed: Number(r.amountReimbursed || 0) }
    );
    cancelEdit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={breadcrumbItems} currentPage="Reimbursed Records" />
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Finance
        </Button>
      </div>

      <GlassCard>
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Reimbursed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedRows.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {groupedRows.map((r: any) => {
                  const spent = Number(r.totalAmountSpent || 0);
                  const reimbursed = Number(r.amountReimbursed || 0);
                  const pending = spent - reimbursed;
                  const pendingChartValue = Math.abs(pending);
                  const pendingColor = pending < 0 ? "#ef4444" : "#f59e0b";
                  const chartData = [
                    { name: "Reimbursed", value: reimbursed, color: "#22c55e" },
                    { name: pending < 0 ? "Over Reimbursed" : "Pending", value: pendingChartValue, color: pendingColor },
                  ].filter((x) => x.value > 0);
                  return (
                  <div
                    key={`kpi-${r.key}`}
                    className="snap-start shrink-0 w-[240px] rounded-lg border bg-card p-2"
                  >
                    <p className="text-sm font-semibold truncate">{r.amountSpentBy}</p>
                    <div className="mt-1 flex items-center justify-center">
                      <PieChart width={130} height={90}>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={18}
                          outerRadius={30}
                          paddingAngle={2}
                        >
                          {chartData.map((entry: any, idx: number) => (
                            <Cell key={`cell-${r.key}-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmtINR(Number(v || 0))} />
                      </PieChart>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-medium">{fmtINR(spent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reimbursed</p>
                        <p className="font-medium">{fmtINR(reimbursed)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className={`font-medium ${pending < 0 ? "text-red-600" : "text-amber-600"}`}>
                          {fmtINR(pending)}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount spent by Name</TableHead>
                  <TableHead className="text-right">Total amount spent</TableHead>
                  <TableHead className="text-right">Amount reimbursed</TableHead>
                  <TableHead className="text-right">Pending amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No reimbursed records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedRows.map((r) => {
                    const amount = Number(r.totalAmountSpent || 0);
                    const liveReimbursed =
                      editingId === r.key
                        ? Number(editingValue || 0)
                        : Number(r.amountReimbursed || 0);
                    const reimbursed = Number.isFinite(liveReimbursed) ? liveReimbursed : 0;
                    const pending = Number(amount - reimbursed);
                    return (
                      <TableRow key={r.key} className="hover:bg-muted/50">
                        <TableCell>{(r as any).amountSpentBy || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmtINR(amount)}</TableCell>
                        <TableCell className="text-right">
                          {editingId === r.key ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="h-8 text-right"
                            />
                          ) : (
                            fmtINR(reimbursed)
                          )}
                        </TableCell>
                        <TableCell className="text-right">{fmtINR(pending)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {editingId === r.key ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveEdit(r)}
                                  className="h-8 w-8 p-0"
                                  disabled={isUpdating}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                  className="h-8 w-8 p-0"
                                  disabled={isUpdating}
                                >
                                  <X className="h-4 w-4 text-gray-600" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(r)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

