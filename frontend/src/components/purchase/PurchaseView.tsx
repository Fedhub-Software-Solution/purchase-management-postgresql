import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY, getExchangeRateDisclaimer } from "../../utils/currency";
import { formatDate } from "../../utils/datetime";
import type { Purchase, Client } from "../../types";
import { getStatusColor, getStatusIcon } from "./utils";
import { PurchaseItemsTable } from "./PurchaseItemsTable";

interface PurchaseViewProps {
  purchase: Purchase;
  client: Client | undefined;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchaseId: string) => void;
  onBack: () => void;
}

export function PurchaseView({
  purchase,
  client,
  onEdit,
  onDelete,
  onBack,
}: PurchaseViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Purchase Order Details</span>
              <Badge className={getStatusColor(purchase.status)}>
                {getStatusIcon(purchase.status)}
                <span className="ml-1 capitalize">{purchase.status}</span>
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => onEdit(purchase)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Purchase Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Purchase Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  PO Number
                </Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono">
                    {purchase.poNumber}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Purchase ID
                </Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono">
                    #{purchase.id}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Created Date
                </Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(purchase?.createdAt)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Total Items
                </Label>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {purchase.items.length}{" "}
                    {purchase.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          {client && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Client Information</h3>
              </div>

              <div className="p-6 border rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Company
                      </Label>
                      <p className="text-lg font-semibold">{client.company}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Contact Person
                      </Label>
                      <p>{client.contactPerson}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Email
                      </Label>
                      <p>{client.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Phone
                      </Label>
                      <p>{client.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items Details */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium">Order Items</h3>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                {purchase.items.length}{" "}
                {purchase.items.length === 1 ? "Item" : "Items"}
              </Badge>
            </div>

            <PurchaseItemsTable
              items={purchase.items}
              onRemove={() => {}}
              mode="view"
            />
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium">Order Summary</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <div className="p-6 border rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-4">Financial Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        purchase.subtotal,
                        purchase.baseCurrency || DEFAULT_CURRENCY
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">GST (18%):</span>
                    <span className="font-medium">
                      {formatCurrency(
                        purchase.tax,
                        purchase.baseCurrency || DEFAULT_CURRENCY
                      )}
                    </span>
                  </div>
                  <div className="border-t border-amber-200 dark:border-amber-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-amber-600">
                        {formatCurrency(
                          purchase.total,
                          purchase.baseCurrency || DEFAULT_CURRENCY
                        )}
                      </span>
                    </div>
                  </div>
                  {purchase.items.some(
                    (item) =>
                      (item.currency || DEFAULT_CURRENCY) !== DEFAULT_CURRENCY
                  ) && (
                    <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                      <p className="text-xs text-muted-foreground italic">
                        * {getExchangeRateDisclaimer()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="p-6 border rounded-xl bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/10 dark:to-gray-900/10 border-slate-200 dark:border-slate-800">
                <h4 className="font-medium mb-4">Purchase Details</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(purchase.status)}>
                        {getStatusIcon(purchase.status)}
                        <span className="ml-2 capitalize">{purchase.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Created
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(purchase?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Total Items
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {purchase.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      units across {purchase.items.length} different items
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {purchase.notes && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500/20 to-slate-500/20">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium">Additional Notes</h3>
              </div>

              <div className="p-6 border rounded-xl bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-900/10 dark:to-slate-900/10 border-gray-200 dark:border-gray-800">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {purchase.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => onEdit(purchase)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Purchase
              </Button>
              <Button
                variant="outline"
                onClick={() => onDelete(purchase.id)}
                className="text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

