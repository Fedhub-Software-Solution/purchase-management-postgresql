import { motion } from "motion/react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Users,
  FileText,
  MapPin,
  CreditCard,
  Copy,
  Save,
  X,
} from "lucide-react";
import { Breadcrumb } from "../Breadcrumb";
import type { ClientFormData } from "./types";
import type { Client } from "../../types";

interface ClientFormProps {
  mode: "add" | "edit";
  formData: ClientFormData;
  onFormDataChange: (data: ClientFormData) => void;
  sameAsBilling: boolean;
  onSameAsBillingChange: (same: boolean) => void;
  onCopyShippingFromBilling: () => void;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  editingClient?: Client | null;
}

export function ClientForm({
  mode,
  formData,
  onFormDataChange,
  sameAsBilling,
  onSameAsBillingChange,
  onCopyShippingFromBilling,
  isLoading,
  onSubmit,
  onCancel,
  editingClient,
}: ClientFormProps) {
  const breadcrumbItems = [
    { label: "Home", onClick: () => {} },
    { label: "Client Management", onClick: onCancel },
  ];
  const currentPage = editingClient ? "Edit Client" : "Add Client";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Breadcrumb items={breadcrumbItems} currentPage={currentPage} />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={onCancel} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Clients</span>
            </Button>
          </motion.div>

          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              {editingClient ? (
                <Edit className="w-6 h-6 text-blue-600" />
              ) : (
                <Plus className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingClient ? "Edit Client" : "Add New Client"}
              </h1>
              <p className="text-muted-foreground">
                {editingClient
                  ? "Update client information below"
                  : "Enter comprehensive client details including business information, addresses, and banking details"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <TabsTrigger value="basic" className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Basic Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Business</span>
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Addresses</span>
                  </TabsTrigger>
                  <TabsTrigger value="banking" className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Banking</span>
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium">Basic Information</h3>
                      <Badge variant="secondary">Required</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center space-x-1">
                          <span>Company Name</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, company: e.target.value })
                          }
                          required
                          placeholder="Enter company name"
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson" className="flex items-center space-x-1">
                          <span>Contact Person</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, contactPerson: e.target.value })
                          }
                          required
                          placeholder="Enter contact person name"
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center space-x-1">
                          <span>Email Address</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, email: e.target.value })
                          }
                          required
                          placeholder="Enter email address"
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center space-x-1">
                          <span>Phone Number</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, phone: e.target.value })
                          }
                          required
                          placeholder="Enter phone number"
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="flex items-center space-x-1">
                          <span>Status</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) =>
                            onFormDataChange({
                              ...formData,
                              status: e.target.value as "active" | "inactive",
                            })
                          }
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div></div>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Business Information Tab */}
                <TabsContent value="business" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium">Business Information</h3>
                      <Badge variant="secondary">Required</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber" className="flex items-center space-x-1">
                          <span>GST Number</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="gstNumber"
                          value={formData.gstNumber}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, gstNumber: e.target.value })
                          }
                          required
                          placeholder="22AAAAA0000A1Z5"
                          maxLength={15}
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-green-500 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground">
                          15-digit GST identification number
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber" className="flex items-center space-x-1">
                          <span>PAN Number</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="panNumber"
                          value={formData.panNumber}
                          onChange={(e) =>
                            onFormDataChange({
                              ...formData,
                              panNumber: e.target.value.toUpperCase(),
                            })
                          }
                          required
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-green-500 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground">10-character PAN number</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="msmeNumber" className="flex items-center space-x-1">
                        <span>MSME Number</span>
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="msmeNumber"
                        value={formData.msmeNumber}
                        onChange={(e) =>
                          onFormDataChange({ ...formData, msmeNumber: e.target.value })
                        }
                        required
                        placeholder="UDYAM-XX-00-0000000"
                        className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-green-500 transition-colors"
                      />
                      <p className="text-xs text-muted-foreground">
                        Udyam registration number for MSME benefits
                      </p>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent value="address" className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Billing Address */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium">Billing Address</h3>
                        <Badge variant="secondary">Required</Badge>
                      </div>

                      <div className="space-y-4 p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
                        <div className="space-y-2">
                          <Label htmlFor="billingStreet" className="flex items-center space-x-1">
                            <span>Street Address</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="billingStreet"
                            value={formData.billingAddress.street}
                            onChange={(e) =>
                              onFormDataChange({
                                ...formData,
                                billingAddress: {
                                  ...formData.billingAddress,
                                  street: e.target.value,
                                },
                              })
                            }
                            required
                            placeholder="Enter street address"
                            rows={2}
                            className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billingCity" className="flex items-center space-x-1">
                              <span>City</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="billingCity"
                              value={formData.billingAddress.city}
                              onChange={(e) =>
                                onFormDataChange({
                                  ...formData,
                                  billingAddress: {
                                    ...formData.billingAddress,
                                    city: e.target.value,
                                  },
                                })
                              }
                              required
                              placeholder="Enter city"
                              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingState" className="flex items-center space-x-1">
                              <span>State</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="billingState"
                              value={formData.billingAddress.state}
                              onChange={(e) =>
                                onFormDataChange({
                                  ...formData,
                                  billingAddress: {
                                    ...formData.billingAddress,
                                    state: e.target.value,
                                  },
                                })
                              }
                              required
                              placeholder="Enter state"
                              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="billingPostalCode"
                              className="flex items-center space-x-1"
                            >
                              <span>Postal Code</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="billingPostalCode"
                              value={formData.billingAddress.postalCode}
                              onChange={(e) =>
                                onFormDataChange({
                                  ...formData,
                                  billingAddress: {
                                    ...formData.billingAddress,
                                    postalCode: e.target.value,
                                  },
                                })
                              }
                              required
                              placeholder="Enter postal code"
                              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="billingCountry"
                              className="flex items-center space-x-1"
                            >
                              <span>Country</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="billingCountry"
                              value={formData.billingAddress.country}
                              onChange={(e) =>
                                onFormDataChange({
                                  ...formData,
                                  billingAddress: {
                                    ...formData.billingAddress,
                                    country: e.target.value,
                                  },
                                })
                              }
                              required
                              placeholder="Enter country"
                              className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <h3 className="text-lg font-medium">Shipping Address</h3>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sameAsBilling"
                              checked={sameAsBilling}
                              onCheckedChange={(checked: any) => {
                                onSameAsBillingChange(checked as boolean);
                                if (checked) {
                                  onCopyShippingFromBilling();
                                }
                              }}
                            />
                            <Label htmlFor="sameAsBilling" className="text-sm">
                              Same as billing address
                            </Label>
                          </div>
                          {sameAsBilling && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onCopyShippingFromBilling}
                                className="flex items-center space-x-1"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {!sameAsBilling && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 p-6 border rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="shippingStreet">Street Address</Label>
                            <Textarea
                              id="shippingStreet"
                              value={formData.shippingAddress.street}
                              onChange={(e) =>
                                onFormDataChange({
                                  ...formData,
                                  shippingAddress: {
                                    ...formData.shippingAddress,
                                    street: e.target.value,
                                  },
                                })
                              }
                              placeholder="Enter street address"
                              rows={2}
                              className="bg-white/70 dark:bg-gray-800/70 border-green-200 dark:border-green-700 focus:border-green-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="shippingCity">City</Label>
                              <Input
                                id="shippingCity"
                                value={formData.shippingAddress.city}
                                onChange={(e) =>
                                  onFormDataChange({
                                    ...formData,
                                    shippingAddress: {
                                      ...formData.shippingAddress,
                                      city: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter city"
                                className="bg-white/70 dark:bg-gray-800/70 border-green-200 dark:border-green-700 focus:border-green-500 transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="shippingState">State</Label>
                              <Input
                                id="shippingState"
                                value={formData.shippingAddress.state}
                                onChange={(e) =>
                                  onFormDataChange({
                                    ...formData,
                                    shippingAddress: {
                                      ...formData.shippingAddress,
                                      state: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter state"
                                className="bg-white/70 dark:bg-gray-800/70 border-green-200 dark:border-green-700 focus:border-green-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="shippingPostalCode">Postal Code</Label>
                              <Input
                                id="shippingPostalCode"
                                value={formData.shippingAddress.postalCode}
                                onChange={(e) =>
                                  onFormDataChange({
                                    ...formData,
                                    shippingAddress: {
                                      ...formData.shippingAddress,
                                      postalCode: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter postal code"
                                className="bg-white/70 dark:bg-gray-800/70 border-green-200 dark:border-green-700 focus:border-green-500 transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="shippingCountry">Country</Label>
                              <Input
                                id="shippingCountry"
                                value={formData.shippingAddress.country}
                                onChange={(e) =>
                                  onFormDataChange({
                                    ...formData,
                                    shippingAddress: {
                                      ...formData.shippingAddress,
                                      country: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter country"
                                className="bg-white/70 dark:bg-gray-800/70 border-green-200 dark:border-green-700 focus:border-green-500 transition-colors"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Banking Information Tab */}
                <TabsContent value="banking" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium">Banking Details</h3>
                      <Badge variant="outline">Optional</Badge>
                    </div>

                    <div className="space-y-4 p-6 border rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={formData.bankDetails.bankName}
                            onChange={(e) =>
                              onFormDataChange({
                                ...formData,
                                bankDetails: {
                                  ...formData.bankDetails,
                                  bankName: e.target.value,
                                },
                              })
                            }
                            placeholder="Enter bank name"
                            className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountHolderName">Account Holder Name</Label>
                          <Input
                            id="accountHolderName"
                            value={formData.bankDetails.accountHolderName}
                            onChange={(e) =>
                              onFormDataChange({
                                ...formData,
                                bankDetails: {
                                  ...formData.bankDetails,
                                  accountHolderName: e.target.value,
                                },
                              })
                            }
                            placeholder="Enter account holder name"
                            className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            value={formData.bankDetails.accountNumber}
                            onChange={(e) =>
                              onFormDataChange({
                                ...formData,
                                bankDetails: {
                                  ...formData.bankDetails,
                                  accountNumber: e.target.value,
                                },
                              })
                            }
                            placeholder="Enter account number"
                            className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifscCode">IFSC Code</Label>
                          <Input
                            id="ifscCode"
                            value={formData.bankDetails.ifscCode}
                            onChange={(e) =>
                              onFormDataChange({
                                ...formData,
                                bankDetails: {
                                  ...formData.bankDetails,
                                  ifscCode: e.target.value.toUpperCase(),
                                },
                              })
                            }
                            placeholder="SBIN0001234"
                            maxLength={11}
                            className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingClient ? "Update Client" : "Add Client"}</span>
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

