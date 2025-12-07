import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Breadcrumb } from "../Breadcrumb";
import { ClientFilters } from "./ClientFilters";
import type { Client } from "../../types";
import type { ClientFilters as ClientFiltersType } from "./types";

interface ClientListProps {
  clients: Client[];
  filteredClients: Client[];
  filters: ClientFiltersType;
  onFiltersChange: (filters: ClientFiltersType) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onCreateNew: () => void;
  isFetching: boolean;
  isDeleting: boolean;
  uniqueStates: string[];
}

export function ClientList({
  clients,
  filteredClients,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onCreateNew,
  isFetching,
  isDeleting,
  uniqueStates,
}: ClientListProps) {
  const breadcrumbItems = [{ label: "Home", onClick: () => {} }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
     

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
        <Breadcrumb items={breadcrumbItems} currentPage="Client Management" />
          {/* <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Client Management
            </h1>
          </div> */}
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            disabled={isFetching}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </motion.div>
      </div>

      <ClientFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        uniqueStates={uniqueStates}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Client Details</h3>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-white/70 dark:bg-gray-800/70">
            {filteredClients.length} of {clients.length} Clients
          </Badge>
          {(filters.search || filters.state !== "all" || filters.status !== "all") && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              Filtered
            </Badge>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
      >
        {filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 px-8"
          >
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {filters.search || filters.state !== "all"
                ? "No clients match your filters"
                : isFetching
                ? "Loading clients…"
                : "No clients found"}
            </p>
            <p className="text-sm text-muted-foreground">
              {filters.search || filters.state !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Add your first client to get started"}
            </p>
          </motion.div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50">
                <TableHead className="font-medium">Company</TableHead>
                <TableHead className="font-medium">Contact Person</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Phone</TableHead>
                <TableHead className="font-medium">Location</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredClients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 transition-all duration-300"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                          <Building className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {client.company}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{client.contactPerson}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 group/email">
                        <Mail className="w-4 h-4 text-muted-foreground group-hover/email:text-blue-600 transition-colors" />
                        <span className="text-sm group-hover/email:text-blue-600 transition-colors truncate max-w-[200px]">
                          {client.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 group/phone">
                        <Phone className="w-4 h-4 text-muted-foreground group-hover/phone:text-green-600 transition-colors" />
                        <span className="text-sm group-hover/phone:text-green-600 transition-colors">
                          {client.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 group/location">
                        <MapPin className="w-4 h-4 text-muted-foreground group-hover/location:text-purple-600 transition-colors" />
                        <span className="text-sm group-hover/location:text-purple-600 transition-colors truncate max-w-[150px]">
                          {client.billingAddress.city}, {client.billingAddress.state}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={(client.status as any) === "active" ? "default" : "secondary"}
                        className={
                          (client.status as any) === "active"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm"
                            : "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 shadow-sm"
                        }
                      >
                        {(client.status as any) === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-1">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(client)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            title="Edit Client"
                            disabled={isFetching}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                        </motion.div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                title="Delete Client"
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </motion.div>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{client.company}</strong>?
                                This action cannot be undone and will permanently remove all client
                                data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(client.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Client
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </motion.div>
    </motion.div>
  );
}

